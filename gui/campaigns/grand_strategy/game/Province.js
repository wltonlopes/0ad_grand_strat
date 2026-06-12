// class Province
// {
// 	constructor(data)
// 	{
// 		this.code = data.code;
// 		this.data = data;
class Province
{
	constructor(data)
	{
		if (data.properties)
		{
			// GeoJSON Feature
			this.code = data.properties.code;
			this.data = data.properties;
		}
		else
		{
			// JSON antigo
			this.code = data.code;
			this.data = data;
		}

		this.gfxdata = {"size": [0,0,4096,2048]};
		// let path =
		// 	"campaigns/grand_strategy/gfxdata/" +
		// 	this.code +
		// 	".json";

		// this.gfxdata =
		// 	Engine.ReadJSONFile(path);

		// if (!this.gfxdata)
		// {
		// 	this.gfxdata =
		// 	{
		// 		"size":
		// 		[
		// 			0,
		// 			0,
		// 			100,
		// 			100
		// 		]
		// 	};

		// 	warn(
		// 		"No gfxdata for " +
		// 		this.code
		// 	);
		// }
		this.gfxdata = {
			"size": [0, 0, 4096, 2048]
		};

		this.icon = undefined;
		this.ownerTribe = undefined;
		this.name = this.data.name;
		this.garrison = 0;
	}

	Serialize()
	{
		return {
			"ownerTribe": this.ownerTribe,
			"garrison": this.garrison > 0 ? this.garrison : undefined
		};
	}

	Deserialize(data)
	{
		this.ownerTribe = data.ownerTribe;
		this.garrison = data.garrison || 0;
	}

	// UI

	getName()
	{
		return this.data.name;
	}

	getColor()
	{
		if (this.ownerTribe)
			return g_GameData.tribes[this.ownerTribe].color.split(" ");

		if (this.data.color)
			return this.data.color.split(" ");

		return [150, 150, 150];
	}

	getCenterPoint()
	{
		let center =
			g_GameData.geo.getPixelCenter(
				this.code
			);

		return [
			center.x,
			center.y
		];
	}
	getHeroPos()
	{
		if (this.data.heroPos)
		{
			return [
				this.data.heroPos.x,
				this.data.heroPos.y
			];
		}

		return this.getCenterPoint();
	}

	getLinks()
	{
		if (this.data.links)
			return this.data.links;

		return g_GameData.geo
			.getNeighbours(
				this.code
			);
	}

	getNativeCivs()
	{
		return this.data.civs ??
			["random"];
	}

	getInfoLevel(tribe)
	{
		if (this.ownerTribe === tribe)
			return 2;
		else if (tribe === g_GameData.playerTribe)
		{
			const links = this.getLinks();
			if (this.code === g_GameData.playerHero.location || links.indexOf(g_GameData.playerHero.location) !== -1)
				return 1;
		}
		return 0;
	}

	// Game
	setOwner(tribe)
		{
			if (this.data.provinceType === "sea")
				return;
	// setOwner(tribe)
	// {
	// 	if (tribe !== this.ownerTribe)
		{
			if (this.ownerTribe)
				g_GameData.tribes[this.ownerTribe].LoseControl(this.code);
			this.ownerTribe = tribe;
			g_GameData.tribes[this.ownerTribe].GainControl(this.code);
		}
	}

	// getBalance()
	// {
	// 	return 100 - this.garrison * 50;
	// }
	getBalance()
	{
		if (this.data.provinceType === "sea")
			return 0;

		return 100 - this.garrison * 50;
	}
	// TODO: A*
	canTravel(code)
	{
		return this.getLinks().indexOf(code) !== -1;
	}

	getCenterPoint()
	{
		if (this.data.centerpoint)
			return this.data.centerpoint;

		let center =
			g_GameData.geo
				.getPixelCenter(
					this.code
				);

		return [
			center.x,
			center.y
		];
	}

	getPosition()
	{
		if (this.data.position)
		{
			return [
				this.data.position.x,
				this.data.position.y
			];
		}

		let bounds = this.getBounds();

		return [
			bounds[0],
			bounds[1]
		];
	}

	isCoastal()
	{
		for (let neighbour of this.getLinks())
		{
			let province =
				g_GameData.provinces[
					neighbour
				];

			if (
				province &&
				province.data.provinceType ==
				"sea"
			)
			{
				return true;
			}
		}

		return false;
	}
	isSea()
	{
		return this.data.provinceType ==
			"sea";
	}
	isLand()
	{
		return this.data.provinceType !=
			"sea";
	}
	getBounds()
	{
		let bounds =
			g_GameData.geo.getPixelBounds(
				this.code
			);

		return bounds;
	}
}