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

const ui = require("ui_lib/library");

const maxCount = 100;
const maxRand = 10;

const pos = new Vec2(-1, -1);

var dialog = null, button = null;
var spawning = UnitTypes.stell, count = 1;
var team = Vars.state.rules.waveTeam;
// Default 2 tiles of random to the unit position
var rand = 2;

// Singleplayer, directly spawn the units
function spawnLocal() {
	for (var n = 0; n < count; n++) {
		Tmp.v1.rnd(Mathf.random(rand * Vars.tilesize));

		var unit = spawning.create(team);
		unit.set(pos.x + Tmp.v1.x, pos.y + Tmp.v1.y);
		unit.add();
	}
}

// Multiplayer, compile a function to send with /js, good for nydus and other abusive servers
function spawnRemote() {
	// TODO
	const unitcode = "UnitTypes." + spawning.name;
	const teamcode = "Team." + team.name;

	const code = [
		// loop optimisation
		(count ? "for(var n=0;n<" + count + ";n++){" : ""),
			"Tmp.v1.rnd(" + Mathf.random(rand * Vars.tilesize) + ");",
			"var u=" + unitcode + ".create(" + teamcode + ");",
			"u.set(" + pos.x + "+Tmp.v1.x," + pos.y + "+Tmp.v1.y);",
			"u.add()",
		(count ? "}" : "")
	].join("");

	Call.sendChatMessage("/js " + code);
}

function spawn() {
	(Vars.net.client() ? spawnRemote : spawnLocal)();
}

ui.onLoad(() => {
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

			const icon = new TextureRegionDrawable(unit.uiIcon);
			list.button(icon, () => {
				spawning = unit;
				button.style.imageUp = icon;
			}).size(128);
		});
	}).top().center();
	table.row();

	/* Random selection */
	const r = table.table().center().bottom().get();
	var rSlider, rField;
	r.defaults().left();
	rSlider = r.slider(0, maxRand, 0.125, rand, n => {
		rand = n;
		rField.text = n;
	}).get();
	r.add("Randomness: ");
	rField = r.field("" + rand, text => {
		rand = parseInt(text);
		rSlider.value = rand;
	}).get();
	rField.validator = text => !isNaN(parseInt(text));
	table.row();
    
	/* Count selection */
	const t = table.table().center().bottom().get();
	var cSlider, cField;
	t.defaults().left();
	cSlider = t.slider(1, maxCount, count, n => {
		count = n;
		cField.text = n;
	}).get();
	t.add("Count: ");
	cField = t.field("" + count, text => {
		count = parseInt(text);
		cSlider.value = count;
	}).get();
	cField.validator = text => !isNaN(parseInt(text));

	table.row();
	var posb;
	posb = table.button("Set Position", () => {
		dialog.hide();
		ui.click((screen, world) => {
			// We don't need sub-wu precision + make /js output nicer
			pos.set(Math.round(world.x), Math.round(world.y));
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

	const teamRect = extend(TextureRegionDrawable, Tex.whiteui, {});
	teamRect.tint.set(team.color);
	dialog.buttons.button("$unit-factory.set-team", teamRect, 40, () => {
		ui.select("$unit-factory.set-team", Team.baseTeams, t => {
			team = t;
			teamRect.tint.set(team.color);
		}, (i, t) => "[#" + t.color + "]" + t);
	});
});

ui.addButton("unit-factory", spawning, () => {
	if (Vars.net.client()) {
		if (!Vars.player.admin) {
			Vars.ui.showInfoToast("You egg that would desync", 5);
			return;
		}
	} else if (Vars.state.rules.sector) {
		Vars.ui.showInfoToast("No cheating! [red]*slaps hand*", 5);
		return;
	}

	dialog.show();
}, b => {button = b.get()});
