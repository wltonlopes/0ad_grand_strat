function loadRelations(controller)
{
	let diplo = controller.player.getDiplomacy(controller.target.code);

	Engine.GetGUIObjectByName("relationStatus").caption =
		"Status: " + diplo.status;

	Engine.GetGUIObjectByName("relationOpinion").caption =
		"Opinion: " + diplo.opinion;

	Engine.GetGUIObjectByName("relationTrust").caption =
		"Trust: " + diplo.trust + "%";
}