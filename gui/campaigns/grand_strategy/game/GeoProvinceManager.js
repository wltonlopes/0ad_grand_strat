class GeoProvinceManager
{
	constructor()
	{
		this.data =
			Engine.ReadJSONFile(
				"campaigns/grand_strategy/data/provinces.geojson"
			);
		this.neighbourCache = {};

		this.buildNeighbourCache();
	}

	getProvince(code)
	{
		return this.data.features.find(
			x =>
			x.properties.code == code
		);
	}
	getCenter(code)
	{
		let province = this.getProvince(code);

		if (!province)
			return null;

		let coords = province.geometry.coordinates[0];

		let x = 0;
		let y = 0;

		for (let point of coords)
		{
			x += point[0];
			y += point[1];
		}

		return {
			"x": x / coords.length,
			"y": y / coords.length
		};
	}
	getBounds()
	{
		let minX = Infinity;
		let maxX = -Infinity;
		let minY = Infinity;
		let maxY = -Infinity;

		for (let feature of this.data.features)
		{
			let coords =
				feature.geometry.coordinates[0];

			for (let point of coords)
			{
				minX = Math.min(minX, point[0]);
				maxX = Math.max(maxX, point[0]);

				minY = Math.min(minY, point[1]);
				maxY = Math.max(maxY, point[1]);
			}
		}

		return {
			minX,
			maxX,
			minY,
			maxY
		};
	}
	pointInPolygon(x, y, polygon)
	{
		let inside = false;

		for (
			let i = 0, j = polygon.length - 1;
			i < polygon.length;
			j = i++
		)
		{
			let xi = polygon[i][0];
			let yi = polygon[i][1];

			let xj = polygon[j][0];
			let yj = polygon[j][1];

			let intersect =
				((yi > y) != (yj > y)) &&
				(
					x <
					(xj - xi) *
					(y - yi) /
					(yj - yi) +
					xi
				);

			if (intersect)
				inside = !inside;
		}

		return inside;
	}
	//
	getProvinceAtPoint(x, y)
	{
		for (let feature of this.data.features)
		{
			let polygon =
				feature.geometry.coordinates[0];

			if (
				this.pointInPolygon(
					x,
					y,
					polygon
				)
			)
			{
				return feature;
			}
		}

		return null;
	}
	polygonsTouch(polyA, polyB)
	{
		for (let pointA of polyA)
		{
			for (let pointB of polyB)
			{
				let dx =
					Math.abs(
						pointA[0] - pointB[0]
					);

				let dy =
					Math.abs(
						pointA[1] - pointB[1]
					);

				if (
					dx < 1 &&
					dy < 1
				)
				{
					return true;
				}
			}
		}

		return false;
	}
	getNeighbours(code)
	{
		if (this.neighbourCache[code])
			return this.neighbourCache[code];

		let province =
			this.getProvince(code);

		if (!province)
			return [];

		let polygonA =
			province.geometry.coordinates[0];

		let neighbours = [];

		for (let feature of this.data.features)
		{
			if (
				feature.properties.code ==
				code
			)
				continue;

			let polygonB =
				feature.geometry.coordinates[0];

			if (
				this.polygonsTouch(
					polygonA,
					polygonB
				)
			)
			{
				neighbours.push(
					feature.properties.code
				);
			}
		}

		this.neighbourCache[code] =
			neighbours;

		return neighbours;
	}
	buildNeighbourCache()
	{
		for (let feature of this.data.features)
		{
			let code =
				feature.properties.code;

			this.neighbourCache[code] = [];
		}

		for (let featureA of this.data.features)
		{
			let codeA =
				featureA.properties.code;

			let polygonA =
				featureA.geometry.coordinates[0];

			for (let featureB of this.data.features)
			{
				let codeB =
					featureB.properties.code;

				if (codeA == codeB)
					continue;

				let polygonB =
					featureB.geometry.coordinates[0];

				if (
					this.polygonsTouch(
						polygonA,
						polygonB
					)
				)
				{
					this.neighbourCache[codeA]
						.push(codeB);
				}
			}
		}
	}
	getCenterPercent(code)
	{
		let center =
			this.getCenter(code);

		if (!center)
			return null;

		let bounds =
			this.getBounds();

		return {
			x:
				(center.x - bounds.minX) /
				(bounds.maxX - bounds.minX),

			y:
				(center.y - bounds.minY) /
				(bounds.maxY - bounds.minY)
		};
	}
	getPixelCenter(code)
	{
		let p =
			this.getCenterPercent(code);

		if (!p)
			return null;

		return {
			x: Math.round(p.x * 4096),
			y: Math.round(p.y * 2048)
		};
	}
	getPixelBounds(code)
	{
		let province = this.getProvince(code);

		if (!province)
			return null;

		let polygon =
			province.geometry.coordinates[0];

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (let point of polygon)
		{
			minX = Math.min(minX, point[0]);
			minY = Math.min(minY, point[1]);

			maxX = Math.max(maxX, point[0]);
			maxY = Math.max(maxY, point[1]);
		}

		return [
			minX,
			minY,
			maxX,
			maxY
		];
	}
}