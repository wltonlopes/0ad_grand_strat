/**
 *
 */
class Hero
{
	// constructor(tribe, province)
	// {
	// 	this.tribe = tribe;
	// 	this.location = province;
	// 	this.actionsLeft = 1;
	// }
	constructor(tribe, province)
	{
		this.id = Date.now() + Math.random();

		this.tribe = tribe;
		this.location = province;
		this.actionsLeft = 1;

		this.army = {
			spearmen: 0,
			swordsmen: 0,
			archers: 0,
			cavalry: 0
		};
	}
	// Serialize()
	// {
	// 	return {
	// 		"tribe": this.tribe,
	// 		"loc": this.location,
	// 		"moves": this.actionsLeft
	// 	};
	// }
	Serialize()
	{
		return {
			"id": this.id,
			"tribe": this.tribe,
			"loc": this.location,
			"moves": this.actionsLeft,
			"army": this.army
		};
	}
	// Deserialize(data)
	// {
	// 	this.tribe = data.tribe;
	// 	this.location = data.loc;
	// 	this.actionsLeft = data.moves;
	// }
	Deserialize(data)
	{
		this.id = data.id;
		this.tribe = data.tribe;
		this.location = data.loc;
		this.actionsLeft = data.moves;
		this.army = data.army || {
			spearmen: 0,
			swordsmen: 0,
			archers: 0,
			cavalry: 0
		};
	}
	ownsProvince(code)
	{
		return g_GameData.provinces[code].ownerTribe === this.tribe;
	}


	canMove(code)
	{
		const target = g_GameData.provinces[code];
		if (!target.canTravel(this.location))
			return false;
		if (target.ownerTribe && !this.ownsProvince(code) &&
			g_GameData.tribes[this.tribe].getDiplomacy(target.ownerTribe).status !== GSDiplomacy.prototype.WAR)
			return false;
		return this.actionsLeft >= 1;
	}

	doMove(code)
	{
		this.location = code;
		this.actionsLeft--;
	}

	// canAttack(code)
	// {
	// 	return !this.ownsProvince(code) && this.actionsLeft >= 1;
	// }

	canAttack(code)
	{
		const province = g_GameData.provinces[code];

		if (province.isSea())
			return false;

		return !this.ownsProvince(code) &&
			this.actionsLeft >= 1;
	}

	// doAttack(code)
	// {
	// 	this.actionsLeft--;
	// 	return g_GameData.playOutAttack(this.tribe, code);
	// }
	doAttack(code)
	{
		const province = g_GameData.provinces[code];

		if (province.isSea())
			return false;

		this.actionsLeft--;
		return g_GameData.playOutAttack(this.tribe, code);
	}

	canStrengthen(code)
	{
		return this.ownsProvince(code) && this.actionsLeft >= 0.5 && g_GameData.provinces[code].garrison < 10;
	}

	doStrengthen(code)
	{
		this.actionsLeft -= 0.5;
		return g_GameData.changeGarrison(code, 1);
	}

	canWeaken(code)
	{
		return this.ownsProvince(code) && this.actionsLeft >= 0.5 && g_GameData.provinces[code].garrison > 0;
	}

	doWeaken(code)
	{
		this.actionsLeft -= 0.5;
		return g_GameData.changeGarrison(code, -1);
	}

}
