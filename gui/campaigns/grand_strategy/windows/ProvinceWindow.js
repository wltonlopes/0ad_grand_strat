class ProvinceDetailsWindow
{
	constructor(menu)
	{
		this.menu = menu;
	}

	render()
	{
		this.display();
	}

	display()
	{
		if (this.menu.selectedProvince === -1 || !Engine.GetGUIObjectByName("tribeDetails").hidden)
		{
			Engine.GetGUIObjectByName("provinceDetails").hidden = true;
			return;
		}

		const province = g_GameData.provinces[this.menu.selectedProvince];
		const tribe = g_GameData.tribes[g_GameData.playerTribe];
		const infoLevel = province.getInfoLevel(g_GameData.playerTribe);

		Engine.GetGUIObjectByName("provinceDetails").hidden = false;

		let str = `Name: ${province.name}\n` +
			`Owner: ${g_GameData.tribes?.[province.ownerTribe]?.getName() || "No-one"}\n`;

		if (infoLevel >= 1)
			str += `Garrison strength: ${province.garrison}\n`;

		if (infoLevel >= 2)
		{
			str += `Balance: ${province.getBalance()}\n`;
			str += `Damage Bonus: ${province.getDamageBonus()}\n`;
			str += `Structures: ${province.buildings.length ? province.buildings.join(", ") : "None"}\n`;
			if (province.buildQueue.length)
				str += `Construction: ${province.buildQueue[0]} (${province.buildProgress}/${g_GameData.getProvinceBuildingData(province.buildQueue[0])?.buildTime || 0})\n`;
		}

		str += `\nGenerals: ${tribe.generals.length}/${tribe.maxGenerals}\n`;
		str += `\n\n` + coloredText("Right-click the province to make actions", "green");

		Engine.GetGUIObjectByName("provinceDetailsText").caption = str;

		const ownerBtn = Engine.GetGUIObjectByName("provinceOwnerButton");
		if (province.ownerTribe && province.ownerTribe !== g_GameData.playerTribe)
		{
			ownerBtn.enabled = true;
			ownerBtn.onPress = () => this.menu.openDiplomacy(province.ownerTribe);

			const ownerTribe = g_GameData.tribes[province.ownerTribe];
			const civ = ownerTribe?.civ || ownerTribe?.data?.civ;
			ownerBtn.sprite = `stretched:session/portraits/emblems/emblem_${civ}.png`;
		}
		else
		{
			ownerBtn.enabled = false;
			ownerBtn.sprite = "grayscale:stretched:session/portraits/emblems/emblem_gaia.png";
		}

		const buildBtn = Engine.TryGetGUIObjectByName("provinceBuildButton");
		const buildList = Engine.TryGetGUIObjectByName("provinceBuildList");
		if (buildBtn && buildList)
		{
			buildBtn.hidden = province.ownerTribe !== g_GameData.playerTribe;
			buildList.hidden = province.ownerTribe !== g_GameData.playerTribe;
			if (province.ownerTribe === g_GameData.playerTribe)
			{
				buildBtn.caption = "Build Structure";
				buildBtn.onPress = () =>
				{
					const defs = province.getBuildableStructures();
					buildList.list = defs.map(def => `${def.name} (${def.cost} gold / ${def.buildTime} turns)`);
					buildList.selected = -1;
				};
				buildList.onSelectionChange = () =>
				{
					if (buildList.selected < 0)
						return;
					const defs = province.getBuildableStructures();
					const def = defs[buildList.selected];
					if (!def)
						return;
					if (province.startBuilding(def.id))
					{
						g_GameData.save();
						this.display();
					}
				};
			}
		}

		const trainBtn = Engine.TryGetGUIObjectByName("trainGeneral");
		if (!trainBtn)
			return;

		trainBtn.hidden = true;
		const GENERAL_COST = 500;

		if (this.menu.selectedProvince === tribe.getCapital())
		{
			trainBtn.hidden = false;
			trainBtn.caption = `Train General (${GENERAL_COST})`;
			trainBtn.enabled = tribe.money >= GENERAL_COST && tribe.generals.length < tribe.maxGenerals;
			trainBtn.onPress = () =>
			{
				let hero = g_GameData.recruitGeneral(g_GameData.playerTribe);
				if (!hero)
					return;

				g_GameData.playerHero = hero;
				g_GameData.save();
				this.menu.centerScrollOnHero();
				this.menu.render();
			};
		}
	}
}
