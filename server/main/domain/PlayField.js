module.exports = class PlayField{
    constructor(playerId)
    {
        this.field=[];
        this.owner=playerId;
        this.currentBlock=1;
    }
};