/*
	Copyright (c) DeltaNedas 2020

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

const ui = require("ui-lib/library");

const maxCount = 100;

const pos = new Vec2(-1, -1);

var dialog = null, button = null;
var spawning = UnitTypes.dagger, count = 1;
var team = Vars.state.rules.waveTeam;

const spawn = () => {
	for (var n = 0; n < count; n++) {
		// 2 tiles of random to the unit position
		Tmp.v1.rnd(2 * Vars.tilesize);

		var unit = spawning.create(team);
		unit.set(pos.x + Tmp.v1.x, pos.y + Tmp.v1.y);
		unit.add();
	}
};

const build = () => {
	dialog = new BaseDialog("$unit-factory");
	const table = dialog.cont;

	/* Unit */
	table.label(() => spawning.localizedName);
	table.row();

	/* Unit selection */
	table.pane(list => {
		const units = Vars.content.units();
		units.sort();
		var i = 0;
		units.each(unit => {
			// Block "unit" for payloads
			if (unit.isHidden()) return;

			if (i++ % 4 == 0) {
				list.row();
			}

			const icon = new TextureRegionDrawable(unit.icon(Cicon.full));
			list.button(icon, () => {
				spawning = unit;
				button.style.imageUp = icon;
			}).size(128);
		});
	}).top().center();
	table.row();

	/* Count selection */
	const t = table.table().center().bottom().get();
	var slider, field;
	t.defaults().left();
	slider = t.slider(1, maxCount, count, n => {
		count = n;
		field.text = n;
	}).get();
	t.add("Count: ");
	field = t.field("" + count, text => {
		count = parseInt(text);
		slider.value = count;
	}).get();
	field.validator = text => !isNaN(parseInt(text));

	table.row();
	var posb;
	posb = table.button("Set Position", () => {
		dialog.hide();
		ui.click((screen, world) => {
			pos.set(world.x, world.y);
			posb.getLabel().text = "Spawn at " + Math.round(pos.x / 8)
				+ ", " + Math.round(pos.y / 8);
			dialog.show();
		}, true);
	}).width(200).get();

	table.row();

	/* Buttons */
	dialog.addCloseButton();
	dialog.buttons.button("$unit-factory.spawn", Icon.modeAttack, spawn)
		.disabled(() => !Vars.world.passable(pos.x / 8, pos.y / 8));

	const teamRect = extendContent(TextureRegionDrawable, Tex.whiteui, {});
	teamRect.tint.set(team.color);
	dialog.buttons.button("$unit-factory.set-team", teamRect, () => {
		ui.select("$unit-factory.set-team", Team.baseTeams, t => {
			team = t;
			teamRect.tint.set(team.color);
		}, (i, t) => "[#" + t.color + "]" + t);
	});
};

ui.onLoad(build);

ui.addButton("unit-factory", spawning, () => {
	if (Vars.state.rules.mode() != Gamemode.sandbox) {
		Vars.ui.showInfoToast("No cheating! [red]*slaps hand*", 5);
		return;
	}

	dialog.show();
}, b => {button = b.get()});
