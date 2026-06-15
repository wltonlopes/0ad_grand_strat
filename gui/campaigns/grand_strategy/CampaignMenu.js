/**
 */
class CampaignMenu
{
	constructor(campaignRun)
	{
		this.run = campaignRun;

		this.selectedProvince = -1;

		this.window = Engine.GetGUIObjectByName("campaignMenuWindow");
		this.window.onTick = () => this.onTick();
		Engine.GetGUIObjectByName("finishTurn").onPress = () => this.doFinishTurn();
		Engine.GetGUIObjectByName('backToMain').onPress = () => this.goBackToMainMenu();

		Engine.GetGUIObjectByName('loadSaveButton').onPress = () => this.openLoadSave(true);

		this.infoTicker = new InfoTicker();
		this.eventPanel = new EventPanel();

		Engine.GetGUIObjectByName("campaignMenuWindow").onMouseLeftPress = () => this.onBlur();
		Engine.GetGUIObjectByName("campaignMenuWindow").onMouseRightPress = () => this.onBlur();

		/*Engine.SetGlobalHotkey("grand_strategy.camera.left", "Down", () => { this.cameraX -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.right", "Down", () => { this.cameraX += 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.up", "Down", () => { this.cameraZ -= 5; });
		Engine.SetGlobalHotkey("grand_strategy.camera.down", "Down", () => { this.cameraZ += 5; });
		*/

		this.cameraX = 0;
		this.cameraZ = 0;

		this.lastRender = Date.now();
		this.zoom = 2.0; // 200%
		this.baseMap =
			Engine.GetGUIObjectByName(
				"campaignBaseMap"
			);

	}

	initialise()
	{

		if (this.run.data.gameData)
			GameData.loadRun();

		this.centerScrollOnHero();
		this.infoTicker.initialise();

		this.render();
	}
	goBackToMainMenu()
	{
		g_GameData.save();
		Engine.SwitchGuiPage("page_pregame.xml", {});
	}

	openLoadSave()
	{
		Engine.SwitchGuiPage("campaigns/grand_strategy/loadsave/page.xml", {
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

	centerScrollOnHero()
	{
		const pos = g_GameData.provinces[g_GameData.playerHero.location].getHeroPos();
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
		if (this.selectedProvince === -1 ||
			!Engine.GetGUIObjectByName("tribeDetails").hidden)
		{
			Engine.GetGUIObjectByName(
				"provinceDetails"
			).hidden = true;
			return;
		}

		const province =
			g_GameData.provinces[
				this.selectedProvince
			];

		const tribe =
			g_GameData.tribes[
				g_GameData.playerTribe
			];

		const infoLevel =
			province.getInfoLevel(
				g_GameData.playerTribe
			);

		Engine.GetGUIObjectByName(
			"provinceDetails"
		).hidden = false;

		let str =
			`Name: ${province.name}\n` +
			`Owner: ${
				g_GameData.tribes?.[
					province.ownerTribe
				]?.getName()
				|| "No-one"
			}\n`;

		if (infoLevel >= 1)
			str +=
				`Garrison strength: ${
					province.garrison
				}\n`;

		if (infoLevel >= 2)
			str +=
				`Balance: ${
					province.getBalance()
				}\n`;

		// Informações dos generais
		str +=
			`\nGenerals: ${
				tribe.generals.length
			}/${tribe.maxGenerals}\n`;

		str +=
			`\n\n` +
			coloredText(
				"Right-click the province to make actions",
				"green"
			);

		Engine.GetGUIObjectByName(
			"provinceDetailsText"
		).caption = str;

		// Botão do dono da província
		const ownerBtn =
			Engine.GetGUIObjectByName(
				"provinceOwnerButton"
			);

		if (province.ownerTribe)
		{
			ownerBtn.enabled = true;

			ownerBtn.onPress = () =>
				this.displayTribeDetails(
					province.ownerTribe
				);

			ownerBtn.sprite =
				"stretched:session/portraits/emblems/emblem_persians.png";
		}
		else
		{
			ownerBtn.enabled = false;

			ownerBtn.sprite =
				"grayscale:stretched:session/portraits/emblems/emblem_persians.png";
		}

		// ---------------------------
		// Train General button
		// ---------------------------

		const trainBtn =
			Engine.TryGetGUIObjectByName(
				"trainGeneral"
			);

		if (!trainBtn)
			return;

		trainBtn.hidden = true;

		const GENERAL_COST = 500;

		if (
			this.selectedProvince ===
			tribe.getCapital()
		)
		{
			trainBtn.hidden = false;

			trainBtn.caption =
				`Train General (${GENERAL_COST})`;

			trainBtn.enabled =
				tribe.money >= GENERAL_COST &&
				tribe.generals.length <
					tribe.maxGenerals;

			trainBtn.onPress = () =>
			{
				let hero =
					g_GameData.recruitGeneral(
						g_GameData.playerTribe
					);

				if (!hero)
					return;

				g_GameData.playerHero =
					hero;

				g_GameData.save();

				this.centerScrollOnHero();
				this.render();
			};
		}
	}


	displayTribeDetails(tribeCode)
	{
		if (tribeCode === -1)
		{
			Engine.GetGUIObjectByName("tribeDetails").hidden = true;
			return;
		}
		Engine.GetGUIObjectByName("tribeDetails").hidden = false;

		const tribe = g_GameData.tribes[tribeCode];

		let diploStr = "";
		if (tribeCode !== g_GameData.playerTribe)
		{
			const diplo = tribe.getDiplomacy(g_GameData.playerTribe);
			diploStr = `Opinion: ${diplo.opinion}\nStatus: ${diplo.status}`;
		}

		Engine.GetGUIObjectByName("tribeDetailsText").caption = `` +
		`Name: ${tribe.data.name}\n` +
		`Money: ${tribe.money}\n` +
		`Diplo: ${diploStr}\n` +
		``;

		Engine.GetGUIObjectByName("goToProvinceButton").onPress = () => {
			this.displayTribeDetails(-1);
			this.displayProvinceDetails();
		};
	}

	displayHeroDetails()
	{
		Engine.GetGUIObjectByName("heroDetailsText").caption = `` +
		`Moves left: ${g_GameData.playerHero.actionsLeft}\n` +
		`Location: ${g_GameData.provinces[g_GameData.playerHero.location].name}\n` +
		`Owner: ${g_GameData.provinces[g_GameData.playerHero.location].ownerTribe || "No-one" }\n`;
		let province = g_GameData.provinces[g_GameData.playerHero.location];

		Engine.GetGUIObjectByName("doAttack").enabled = g_GameData.playerHero.canAttack(province.code);
		Engine.GetGUIObjectByName("doAttack").onPress = () => g_GameData.playerHero.doAttack(province.code);

		Engine.GetGUIObjectByName("strengthenGarrison").enabled = g_GameData.playerHero.canStrengthen(province.code);
		Engine.GetGUIObjectByName("weakenGarrison").enabled = g_GameData.playerHero.canWeaken(province.code);
		Engine.GetGUIObjectByName("strengthenGarrison").onPress = () => g_GameData.playerHero.doStrengthen(province.code);
		Engine.GetGUIObjectByName("weakenGarrison").onPress = () => g_GameData.playerHero.doWeaken(province.code);
	}

	displayContextualPanel(code)
	{
		if (code === -1)
		{
			Engine.GetGUIObjectByName("contextPanel").hidden = true;
			return;
		}
		this.selectedProvince = code;
		const pos = [
			this.mouseX / this.zoom + this.cameraX,
			this.mouseY / this.zoom + this.cameraZ
		];
		Engine.GetGUIObjectByName("contextPanel").size = this.toGUISize(...pos, pos[0] + 250, pos[1] + 200);
		Engine.GetGUIObjectByName("contextPanel").hidden = false;

		// Move there button.
		Engine.GetGUIObjectByName("contextPanelButton[0]").hidden = false;
		Engine.GetGUIObjectByName("contextPanelButton[0]").enabled =
			g_GameData.playerHero.canMove(code) &&
			code !== g_GameData.playerHero.location;
		Engine.GetGUIObjectByName("contextPanelButton[0]").onPress = () => {
			g_GameData.playerHero.doMove(code);
			this.displayContextualPanel(-1);
		};
		Engine.GetGUIObjectByName("contextPanelButton[0]").caption = "Move there";
		if (!g_GameData.provinces[code].ownerTribe || g_GameData.provinces[code].ownerTribe === g_GameData.playerTribe)
		{
			for (let i = 1; i < 5; ++i)
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).hidden = true;
		}
		else
		{
			const actions = g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(g_GameData.provinces[code].ownerTribe).getActions();
			let i = 1;
			for (const key in actions)
			{
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).enabled = actions[key];
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).hidden = false;
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).onPress = () => {
					this.displayContextualPanel(-1);
					const ev = g_GameData.tribes[g_GameData.playerTribe].getDiplomacy(g_GameData.provinces[code].ownerTribe)[key]();
					g_GameData.pushTurnEvent(ev);
				};
				Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).caption = key;
				++i;
			}
		}
		for (let i = 0; i < 5; ++i)
			Engine.GetGUIObjectByName(`contextPanelButton[${i}]`).size = `0 ${i*28} 100% ${(i+1)*28}`;
	}

	render()
	{
		let map =
		Engine.GetGUIObjectByName(
			"campaignBaseMap"
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

		this.displayHeroDetails();
		this.displayProvinceDetails();

		// Update heros
		const generals =
			g_GameData.tribes[
				g_GameData.playerTribe
			].generals;

		for (let i = 0; i < 10; ++i)
		{
			let icon =
				Engine.GetGUIObjectByName(
					`heroButton[${i}]`
				);

			icon.hidden = true;
		}

		for (let i = 0;
			i < generals.length;
			++i)
		{
			const hero = generals[i];

			let icon =
				Engine.GetGUIObjectByName(
					`heroButton[${i}]`
				);

			if (!icon)
				continue;

			let pos =
				g_GameData.provinces[
					hero.location
				].getHeroPos();

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
				g_GameData.selectHero(
					hero.id
				);

				this.centerScrollOnHero();
			};

			// destaque do general selecionado
		if (hero === g_GameData.playerHero)
			icon.sprite =
				"stretched:session/portraits/units/gaul_hero_viridomarus.png";
		else
			icon.sprite =
				"grayscale:stretched:session/portraits/units/gaul_hero_viridomarus.png";
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
			// let bounds = province.getBounds();

			// let content =
			// 	province.data.maskContentBounds;

			// let scaleX =
			// 	(bounds[2] - bounds[0]) /
			// 	(content[2] - content[0]);

			// let scaleY =
			// 	(bounds[3] - bounds[1]) /
			// 	(content[3] - content[1]);

			let b = province.getBounds();

			// warn(province.code + " POS = " + uneval({
			// 	x0: b[0],
			// 	y0: b[1],
			// 	x1: b[2],
			// 	y1: b[3],
			// 	w: b[2] - b[0],
			// 	h: b[3] - b[1]
			// }));
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

		const delta = Date.now() - this.lastRender;
		const SCROLL_SPEED = delta * 0.6 / this.zoom;
		if (this.mouseX < 10)
			this.cameraX -= SCROLL_SPEED;
		else if (this.mouseX >= this.window.getComputedSize().right - 10)
			this.cameraX += SCROLL_SPEED;
		if (this.mouseY < 10)
			this.cameraZ -= SCROLL_SPEED;
		else if (this.mouseY >= this.window.getComputedSize().bottom - 10)
			this.cameraZ += SCROLL_SPEED;

		this.lastRender = Date.now();
	}

	handleInputAfterGui(ev)
	{
		if (ev.type !== "mousemotion")
			return false;
		this.mouseX = ev.x;
		this.mouseY = ev.y;
		return true;
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
}

function handleInputAfterGui(ev, hoveredObject)
{
	return g_CampaignMenu.handleInputAfterGui(ev, hoveredObject);
}
