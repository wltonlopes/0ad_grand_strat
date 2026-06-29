class CampaignWindows
{
    constructor(menu)
    {
        this.Context = new ContextMenu(menu);
        this.Province = new ProvinceDetailsWindow(menu);
        this.Tribe = new TribeDetailsWindow(menu);
        this.Hero = new HeroDetailsWindow(menu);
        this.Diplomacy = new DiplomacyWindow(menu);
        this.Event = new EventWindow(menu);
        this.GameOver = new GameOverWindow(menu);
    }

    render()
    {
        this.Hero.render();
        this.Province.render();
        this.Tribe.render();
    }
}