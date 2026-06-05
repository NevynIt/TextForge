# TextForge EA Dashboard Examples

This folder contains bundled enterprise architecture reference assets derived from the `C:/Stuff/ea-dashboard` Django fixture JSON model.

- `ea-dashboard-profile.itm` declares the `ead::` ITM profile for the EA Dashboard architecture model.
- `ea-dashboard-json-to-itm.lua` converts a Django fixture JSON export into ITM using that profile.
- `ea-dashboard-itm-to-json.lua` converts ITM generated with the profile back into Django fixture JSON.
- `ea-dashboard-sample.json` is a small representative fixture covering every model type and relationship family in the profile.
- `ea-dashboard-retail-architecture.json` is the larger global retail architecture example imported from the sibling `ea-dashboard` repository on 2026-06-05.
- `ea-dashboard-retail-architecture.itm` is the bundled ITM conversion of that retail fixture, including additional retail-oriented viewpoints and views layered on top of the shared EA Dashboard profile.

The translators are bundled examples. They are inert until opened and run manually or copied into the workspace automation area.
