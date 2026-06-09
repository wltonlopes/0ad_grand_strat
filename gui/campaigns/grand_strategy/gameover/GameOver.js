function init(data) {
	let title = Engine.GetGUIObjectByName("title");
	let message = Engine.GetGUIObjectByName("message");

	title.caption =
		data?.title || "Defeat";

	message.caption =
		data?.message ||
		"Your kingdom has fallen.";

	Engine.GetGUIObjectByName(
		"newCampaignButton"
	).onPress = () =>
	{
		Engine.SwitchGuiPage(
			"campaigns/grand_strategy/init/page.xml"
		);
	};
}