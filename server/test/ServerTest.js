const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const Server = require("/server/main/domain/Server");

describe('server', function () {
    it('getSubtotal() should return 0 if no items are passed in', function () {
        var server = new Server();
        expect(cartSummary.getSubtotal()).to.equal(0);
    });
});