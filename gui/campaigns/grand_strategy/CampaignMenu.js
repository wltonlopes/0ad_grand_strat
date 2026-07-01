/**
 */
var g_CampaignMenu = undefined;
class CampaignMenu extends AutoWatcher
{
	constructor(run, closePageCallback)
	{
		super("render");
		g_CampaignMenu = this;
		this.run = run;
		this.closePageCallback = closePageCallback;

		this.selectedProvince = -1;
		

		this.window = Engine.GetGUIObjectByName("campaignMenuWindow");
		this.window.onTick = () => this.onTick();
		Engine.GetGUIObjectByName("finishTurn").onPress = () => this.doFinishTurn();
		Engine.GetGUIObjectByName('backToMain').onPress = () => this.goBackToMainMenu();

		Engine.GetGUIObjectByName('loadSaveButton').onPress = () => this.openLoadSave(true);

		this.infoTicker = new InfoTicker();
		this.eventPanel = new EventPanel();
		this.windows = new CampaignWindows(this);

		Engine.GetGUIObjectByName("campaignMenuWindow").onMouseLeftPress = () => this.onBlur();
		Engine.GetGUIObjectByName("campaignMenuWindow").onMouseRightPress = () => this.onBlur();

		/*Engine.SetGlobalHotkey("grand_strategy.camera.left", "Down", () => { this.cameraX -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.right", "Down", () => { this.cameraX += 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.up", "Down", () => { this.cameraZ -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.down", "Down", () => { this.cameraZ += 5; });
		*/
		this.worldMap =
			Engine.GetGUIObjectByName(
				"worldMap"
			);
		this.cameraX = 0;
		this.cameraZ = 0;

		const size =
			this.window.getComputedSize();

		this.mouseX = size.right / 2;
		this.mouseY = size.bottom / 2;


		this.lastRender = Date.now();
		this.zoom = 2.0; // 200%
		this.baseMap =
			Engine.GetGUIObjectByName(
				"campaignBaseMap"
			);
		this.worldMap =
			Engine.GetGUIObjectByName(
				"worldMap"
			);
		Engine.GetGUIObjectByName("backToMain").onPress =() => this.goBackToMainMenu();

		this.closePageCallback =
			closePageCallback;

	}

	// initialise()
	// {

	// 	if (this.run.data.gameData)
	// 		GameData.loadRun();

	// 	this.centerScrollOnHero();
	// 	this.infoTicker.initialise();

	// 	this.render();
	// }

	initialise()
	{
		warn("initialise()");

		if (this.run.data.gameData)
			GameData.loadRun();

		warn("GameData carregado");

		this.centerScrollOnHero();

		warn("Hero centralizado");

		this.infoTicker.initialise();

		warn("Ticker");

		this.render();

		warn("Render");
	}

	goBackToMainMenu()
	{
		g_GameData.save();

		this.closePageCallback({
			[Engine.openRequest]:
			{
				page: "page_pregame.xml"
			}
		});
	}

	openLoadSave()
	{
		SwitchGuiPage("campaigns/grand_strategy/loadsave/page.xml", {
			"gameData": g_GameData.Serialize(),
		});
	}

	doFinishTurn()
	{
		this.displayContextualPanel(-1);
		Engine.GetGUIObjectByName("computingTurn").hidden = false;
	}

	onTick()
	{
		// TODO: unhack this.
		if (!Engine.GetGUIObjectByName("computingTurn").hidden)
		{
			if (g_GameData.doFinishTurn())
				this.onTurnComputationEnd();
			return;
		}
		this.render();
	}

	onTurnComputationEnd()
	{
		Engine.GetGUIObjectByName("computingTurn").hidden = true;
		this.infoTicker.onTurnEnd();
	}

	// centerScrollOnHero()
	// {
	// 	const province =
	// 		g_GameData.provinces[
	// 			g_GameData.playerHero.location
	// 		];

	// 	if (!province)
	// 		return;

	// 	const pos =
	// 		province.getHeroPos();
	// }
	centerScrollOnHero()
	{
		const province =
			g_GameData.provinces[
				g_GameData.playerHero.location
			];

		const pos =
			province.getHeroPos();


		this.cameraX =
			pos[0] -
			this.window.getComputedSize().right /
			(2 * this.zoom);

		this.cameraZ =
			pos[1] -
			this.window.getComputedSize().bottom /
			(2 * this.zoom);
	}
	/**
	 * Triggered when pressing the map background.
	 */
	onBlur()
	{
		Engine.GetGUIObjectByName("contextPanel").hidden = true;
		this.selectedProvince = -1;
	}

	displayProvinceDetails()
	{
		this.windows.Province.display();
	}

	openDiplomacy(tribeCode)
	{
		this.windows.Diplomacy.open(tribeCode);
	}

	displayTribeDetails(tribeCode)
	{
		this.windows.Tribe.display(tribeCode);
	}

	displayHeroDetails()
	{
		this.windows.Hero.render();
	}

	displayContextualPanel(code)
	{
		this.windows.Context.display(code);
	}

	render()
	{
		const delta =
			Date.now() -
			this.lastRender;

		this.lastRender =
			Date.now();

		const SCROLL_SPEED =
			delta * 0.8 / this.zoom;

    this.worldMap.size =
        this.toGUISize(
            0,
            0,
            4096,
            2048
        );

    this.baseMap.size =
        this.toGUISize(
            0,
            0,
            4096,
            2048
        );

		Engine.GetGUIObjectByName("topPanelText").caption = `` +
		`Turn ${g_GameData.turn}` +
		` Tribe "${g_GameData.playerTribe}"` +
		` Money ${g_GameData.tribes[g_GameData.playerTribe].money}` +
		` Balance ${g_GameData.tribes[g_GameData.playerTribe].lastBalance}` +
		``;

		this.windows.render();

		const stats = g_CampaignStatistics?.GetData?.() || g_GameData?.statistics?.GetData?.() || {};
		const historyList = Engine.TryGetGUIObjectByName("campaignStatsList");
		if (historyList)
		{
			historyList.list = [];
			for (const entry of stats.timeline || [])
				historyList.list.push(`${entry.turn} - ${entry.text}`);
		}

		const visible = new Set();

		for (const hero of
			g_GameData.tribes[
				g_GameData.playerTribe
			].generals)
		{
			visible.add(hero.location);

			for (const p of
				g_GameData.provinces[
					hero.location
				].getLinks())
			{
				visible.add(p);
			}
		}
		// Update heros
		const generals =
			g_GameData.tribes[
				g_GameData.playerTribe
			].generals;

// Esconde todos os ícones primeiro
		for (let i = 0; i < 100; ++i)
		{
			let icon =
				Engine.TryGetGUIObjectByName(
					`heroButton[${i}]`
				);

			if (icon)
				icon.hidden = true;
		}

		let heroIndex = 0;

		for (const tribeCode in g_GameData.tribes)
		{
			const tribe =
				g_GameData.tribes[tribeCode];

			for (const hero of tribe.generals)
			{
				// Fog of war
				// if (
				// 	tribeCode !=
				// 		g_GameData.playerTribe &&
				// 	!visible.has(hero.location)
				// )
				// 	continue;

				let icon =
					Engine.TryGetGUIObjectByName(
						`heroButton[${heroIndex}]`
					);

				if (!icon)
					continue;

				heroIndex++;

			let province =
				g_GameData.provinces[
					hero.location
				];

			if (!province)
			{
				warn(
					"General without province: " +
					hero.id
				);
				continue;
			}

			let pos =
				province.getHeroPos();

				icon.hidden = false;

				icon.size =
					this.toGUISize(
						...this.centeredSizeAt(
							[16,16],
							pos
						)
					);

				icon.onPress = () =>
				{
					if (
						tribeCode ==
						g_GameData.playerTribe
					)
					{
						g_GameData.selectHero(hero.id);

						this.centerScrollOnHero();
						this.render();
					}
					else
					{
						this.displayEnemyGeneral(
							hero
						);
					}
				};

				const portrait =
					hero.portrait ||
					"session/portraits/heroes/default.png";

				if (
					tribeCode ==
					g_GameData.playerTribe
				)
				{
					icon.sprite =
						hero ==
						g_GameData.playerHero ?
						"stretched:" + portrait :
						"grayscale:stretched:" + portrait;
				}
				else
				{
					icon.sprite =
						"stretched:" + portrait;
				}

				// if (
				// 	tribeCode ==
				// 	g_GameData.playerTribe
				// )
				// {
				// 	icon.sprite =
				// 		hero ==
				// 		g_GameData.playerHero ?
				// 		"stretched:session/portraits/units/gaul_hero_viridomarus.png" :
				// 		"grayscale:stretched:session/portraits/units/gaul_hero_viridomarus.png";
				// }
				// else
				// {
				// 	icon.sprite =
				// 		"stretched:session/portraits/units/gaul_hero_viridomarus.png";
				// }
			}
		}
		// Update provinces
		let i = 0;
		for (let code in g_GameData.provinces)
		{
			
			let province = g_GameData.provinces[code];
			if (!province.icon)
			{
				let icon = Engine.GetGUIObjectByName(`mapProvinceSprite[${i++}]`);
				icon.hidden = false;
				icon.parent.hidden = false;
				icon.onPress = () => { this.displayTribeDetails(-1); this.selectedProvince = province.code; };
				icon.onMouseRightPress = () => { this.displayContextualPanel(province.code); };
				province.icon = icon;
				province.icon.z = province.data.provinceType == "sea" ? 1 : 10;
				province.icon.mouse_event_mask ="texture:campaigns/grand_strategy/provinces/" + province.code + ".png";
			}

			let pos = province.getPosition();

			province.icon.size =
				this.toGUISize(
					pos[0],
					pos[1],
					pos[0] + 1024,
					pos[1] + 1024
				);

			let b = province.getBounds();


			const cityIcon = Engine.GetGUIObjectByName(province.icon.name.replace("Sprite", "City"));
			if (province.ownerTribe)
			{
				const hpos = province.getHeroPos();
				cityIcon.size = this.toGUISize(...this.centeredSizeAt([12, 12], hpos));
				cityIcon.hidden = false;
			}
			else
				cityIcon.hidden = true;

			const inLos =
			province.ownerTribe ===
				g_GameData.playerTribe ||
			visible.has(code);
			let color = province.data.provinceType === "sea" ?
				[255, 255, 255] :
				province.getColor();
			if (
				!color ||
				isNaN(color[0]) ||
				isNaN(color[1]) ||
				isNaN(color[2])
			)
			{
				color = [150, 150, 150];
			}

			color.push(
				province.ownerTribe ? 70 : 30
			);
			if (!inLos)
			{
				color[0] = Math.round(color[0] * 0.33);
				color[1] = Math.round(color[1] * 0.33);
				color[2] = Math.round(color[2] * 0.33);
				color[3] = 150;
			}
			if (province.code === this.selectedProvince)
				color[3] = 100;
			let colorString = color.join(" ");
			let sprite =`color:${colorString}:textureAsMask:campaigns/grand_strategy/provinces/${province.code}.png`;
			province.icon.sprite = sprite;
		}


		// Render event
		const didRenderEvent = this.eventPanel.renderEvents(g_GameData.turnEvents);

		Engine.GetGUIObjectByName("finishTurn").enabled = !didRenderEvent && g_GameData?.canAdvanceTurn();

	const BORDER = 40;

	if (this.mouseX !== null && this.mouseY !== null)
	{
		if (this.mouseX <= BORDER)
			this.cameraX -= SCROLL_SPEED;

		if (this.mouseX >=
			this.window.getComputedSize().right - BORDER)
			this.cameraX += SCROLL_SPEED;

		if (this.mouseY <= BORDER)
			this.cameraZ -= SCROLL_SPEED;

		if (this.mouseY >=
			this.window.getComputedSize().bottom - BORDER)
			this.cameraZ += SCROLL_SPEED;
	}
	}

	handleInputAfterGui(ev)
	{
		if (ev.type !== "mousemotion")
			return false;

		this.mouseX = ev.x;
		this.mouseY = ev.y;

		return false;
	}

	centeredSizeAt(size, pos)
	{
		return [
			pos[0] - size[0],
			pos[1] - size[1],
			pos[0] + size[0],
			pos[1] + size[1]
		];
	}
	toGUISize(x0, z0, x1, z1)
	{
		return `${
			Math.round((x0 - this.cameraX) * this.zoom)
		} ${
			Math.round((z0 - this.cameraZ) * this.zoom)
		} ${
			Math.round((x1 - this.cameraX) * this.zoom)
		} ${
			Math.round((z1 - this.cameraZ) * this.zoom)
		}`;
	}
	// toGUISize(x0, z0, x1, z1)
	// {
	// 	return `${Math.round(x0 - this.cameraX)} ${Math.round(z0 - this.cameraZ)} ${Math.round(x1 - this.cameraX)} ${Math.round(z1 - this.cameraZ)}`;
	// }
displayEnemyGeneral(hero)
	{
		const tribe =
			g_GameData.tribes[
				hero.tribe
			];

		const province =
			g_GameData.provinces[
				hero.location
			];

		let text =
			`General: ${hero.id}\n` +
			`Tribe: ${tribe?.data?.name || hero.tribe}\n` +
			`Province: ${province?.name || hero.location}\n` +
			`Actions Left: ${hero.actionsLeft}`;

		warn(text);
	}
	showGameOver(title, message)
	{
		Engine.GetGUIObjectByName(
			"gameOverWindow"
		).hidden = false;

		Engine.GetGUIObjectByName(
			"title"
		).caption = title;

		Engine.GetGUIObjectByName(
			"message"
		).caption = message;

		Engine.GetGUIObjectByName(
			"newCampaignButton"
		).onPress = () =>
		{
			this.closePageCallback({
				[Engine.openRequest]:
				{
					page: "campaigns/grand_strategy/init/page.xml"
				}
			});
		};
	}

}


function handleInputAfterGui(ev, hoveredObject)
{
	if (!g_GrandStrategyPage || !g_GrandStrategyPage.menu)
		return false;

	return g_GrandStrategyPage.menu.handleInputAfterGui(
		ev,
		hoveredObject
	);
}


