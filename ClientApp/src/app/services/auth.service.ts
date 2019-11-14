import { Injectable } from '@angular/core';
import createAuth0Client from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import { from, of, Observable, BehaviorSubject, combineLatest, throwError } from 'rxjs';
import { tap, catchError, concatMap, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Create an observable of Auth0 instance of client
    auth0Client$ = (from(
        createAuth0Client({
            domain: "iamsud-azure.auth0.com",
            client_id: "mtH6IghpyOaR4FxeFVWCth4Cx8CXcJW9",
            //redirect_uri: `${window.location.origin}`
            redirect_uri: "https://localhost:44381"
        })
    ) as Observable<Auth0Client>).pipe(
        shareReplay(1), // Every subscription receives the same shared value
        catchError(err => throwError(err))
    );

    //public isAuthenticated(): boolean {
    //    let expiresAt = localStorage.getItem('expires_at');
    //    if (!expiresAt) return false;

    //    return new Date().getTime() < JSON.parse(expiresAt);
    //}

    //public setSession(authResult: any): void {
    //    const expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    //    localStorage.setItem('access_token', authResult.accessToken);
    //    localStorage.setItem('id_token', authResult.idToken);
    //    localStorage.setItem('expires_at', expiresAt);

    //}

    //public handleAuthentication(): void {
    //    this.auth0Client$.parseHash((err, authResult)){
    //        if (authResult && authResult.accessToken) {
    //            this.setSession(authResult);
    //        } else if (err) {
    //            this.router.navigate([""]);
    //        }
    //    }


    //    this.auth0Client$.subscribe((client: Auth0Client) => {
    //        // Call method to log in
    //        const accessToken = client.getTokenSilently();
    //        const claims = client.getIdTokenClaims();
    //        const id_token = claims.__raw;
    //        });

          
    //}





    // Define observables for SDK methods that return promises by default
    // For each Auth0 SDK method, first ensure the client instance is ready
    // concatMap: Using the client instance, call SDK method; SDK returns a promise
    // from: Convert that resulting promise into an observable
    isAuthenticated$ = this.auth0Client$.pipe(
        concatMap((client: Auth0Client) => from(client.isAuthenticated())),
        tap(res => this.loggedIn = res)
    );
    handleRedirectCallback$ = this.auth0Client$.pipe(
        concatMap((client: Auth0Client) => from(client.handleRedirectCallback()))
    );
    // Create subject and public observable of user profile data
    private userProfileSubject$ = new BehaviorSubject<any>(null);
    userProfile$ = this.userProfileSubject$.asObservable();
    // Create a local property for login status
    loggedIn: boolean = null;

    constructor(private router: Router) { }

    // When calling, options can be passed if desired
    // https://auth0.github.io/auth0-spa-js/classes/auth0client.html#getuser
    getUser$(options?): Observable<any> {
        return this.auth0Client$.pipe(
            concatMap((client: Auth0Client) => from(client.getUser(options))),
            tap(user => this.userProfileSubject$.next(user))
        );
    }

    localAuthSetup() {
        // This should only be called on app initialization
        // Set up local authentication streams
        const checkAuth$ = this.isAuthenticated$.pipe(
            concatMap((loggedIn: boolean) => {
                if (loggedIn) {
                    // If authenticated, get user and set in app
                    // NOTE: you could pass options here if needed

                    //this.auth0Client$.subscribe((client: Auth0Client) => {
                    //    // Call method to log in
                    //    //const access_Token = client.getTokenSilently();
                    //    //const claims = await client.getIdTokenClaims();
                    //    //const id_token = claims.__raw;
                    //    //const expiresAt = JSON.stringify((.expiresIn * 1000) + new Date().getTime());
                    //    //localStorage.setItem('access_token', access_Token);
                    //    //localStorage.setItem('id_token', id_Token);
                    //    //localStorage.setItem('expires_at', expiresAt);
                    //});
                    return this.getUser$();
                }
                // If not authenticated, return stream that emits 'false'
                return of(loggedIn);
            })
        );
        checkAuth$.subscribe();
    }

    login(redirectPath: string = '/') {
        // A desired redirect path can be passed to login method
        // (e.g., from a route guard)
        // Ensure Auth0 client instance exists
        this.auth0Client$.subscribe((client: Auth0Client) => {
            // Call method to log in
            client.loginWithRedirect({
                redirect_uri: `${window.location.origin}`,
                appState: { target: redirectPath }
            });
        });
    }

    handleAuthCallback() {
        // Call when app reloads after user logs in with Auth0
        const params = window.location.search;
        if (params.includes('code=') && params.includes('state=')) {
            let targetRoute: string; // Path to redirect to after login processsed
            const authComplete$ = this.handleRedirectCallback$.pipe(
                // Have client, now call method to handle auth callback redirect
                tap(cbRes => {
                    // Get and set target redirect route from callback results
                    targetRoute = cbRes.appState && cbRes.appState.target ? cbRes.appState.target : '/';
                }),
                concatMap(() => {
                    // Redirect callback complete; get user and login status
                    return combineLatest([
                        this.getUser$(),
                        this.isAuthenticated$
                    ]);
                })
            );
            // Subscribe to authentication completion observable
            // Response will be an array of user and login status
            authComplete$.subscribe(([user, loggedIn]) => {
                // Redirect to target route after callback processing
                this.router.navigate([targetRoute]);
            });
        }
    }

    logout() {
        // Ensure Auth0 client instance exists
        this.auth0Client$.subscribe((client: Auth0Client) => {

            localStorage.removeItem('access_token');
            localStorage.removeItem('id_token');
            localStorage.removeItem('expires_at');

            // Call method to log out
            client.logout({
                client_id: "mtH6IghpyOaR4FxeFVWCth4Cx8CXcJW9",
                returnTo: `${window.location.origin}`
            });
        });
    }

}
