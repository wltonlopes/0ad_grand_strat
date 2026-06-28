function loadTreaties(controller)
{
	let diplo = controller.player.getDiplomacy(controller.target.code);

	let list = [];

	if (diplo.treaties.alliance)
		list.push("✓ Alliance");

	if (diplo.treaties.trade)
		list.push("✓ Trade");

	if (diplo.treaties.nonAggression)
		list.push("✓ Non Aggression");

	if (diplo.treaties.militaryAccess)
		list.push("✓ Military Access");

	if (!list.length)
		list.push("No active treaties");

	Engine.GetGUIObjectByName("treatyList").caption =
		list.join("\n");
}