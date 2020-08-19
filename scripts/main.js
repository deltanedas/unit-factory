/*
	Copyright (c) DeltaNedas 2020

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const ui = require("ui-lib/library");

const maxCount = 100;

var dialog = null;
var spawning = UnitTypes.dagger, count = 1;

const spawn = () => {
	const spawns = Vars.spawner.spawns;
	for (var i = 0; i < spawns.size; i++) {
		for (var n = 0; n < count; n++) {
			// 2 tiles of random to the unit position
			Tmp.v1.rnd(2 * Vars.tilesize);

			var spawn = spawns.get(i);
			var unit = spawning.create(Vars.state.rules.waveTeam);
			unit.set(spawn.worldx() + Tmp.v1.x, spawn.worldy() + Tmp.v1.y);
			unit.add();
		}
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
			}).size(128);
		});
	}).top().center();
	table.row();

	/* Count selection */
	const t = table.table().center().bottom().get();
	t.defaults().left();
	t.slider(1, maxCount, count, n => {
		count = n;
	});
	t.label(() => "Count: " + count);

	/* Buttons */
	dialog.addCloseButton();
	dialog.buttons.button("$unit-factory.spawn", Icon.modeAttack, run(spawn));
};

ui.onLoad(build);

ui.addButton("unit-factory", UnitTypes.dagger, () => {
	if (Vars.state.rules.mode() != Gamemode.sandbox) {
		Vars.ui.showInfoToast("No cheating! [red]*slaps hand*", 5);
		return;
	}

	dialog.show();
});
