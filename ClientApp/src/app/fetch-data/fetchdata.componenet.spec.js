"use strict";
//describe('fetchdata', () => {
//    it('works', () => {
//        expect(1).toBe(1);
//    })
//});
Object.defineProperty(exports, "__esModule", { value: true });
var MocHttp = /** @class */ (function () {
    function MocHttp() {
    }
    MocHttp.prototype.get = function (url) {
        return { subscribe: function () { } };
    };
    return MocHttp;
}());
exports.MocHttp = MocHttp;
//# sourceMappingURL=fetchdata.componenet.spec.js.map