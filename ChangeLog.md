### EQPal - v0.5.5

### Changes

- Fixed the overlay windows sinking behind other windows on the desktop while in full screen.
- Officers can now take bids again.
  - Officers need to enter `/gu bid <ITEM_LINK>` in order to start a bid.
- Added a speech preview when adding speech to be spoken in a trigger.
  - Previewing the speech will eliminate the delay when running a trigger for the first time. It is HIGHLY recommended to always preview the speech before attempting to use the trigger.

Known Issues
https://github.com/paulwsully/VGina/issues

Help Docs
https://vgina.snazzydocs.com/welcome (Major WIP!)

====================================================================================

### EQPal - v0.5.4

### Changes

- Working on getting the updater working.

Known Issues
https://github.com/paulwsully/VGina/issues

Help Docs
https://vgina.snazzydocs.com/welcome (Major WIP!)

====================================================================================

### EQPal - v0.5.3

### Changes

- Fixed a missing file issue that was causing the `:bid <ITEM_LINK>` to not work properly

Known Issues
https://github.com/paulwsully/VGina/issues

Help Docs
https://vgina.snazzydocs.com/welcome (Major WIP!)

====================================================================================

### EQPal - v0.5.2

### Changes

- Fixed the in-game bids not registering as bids
- Updated the hardcoded `clientID` for OpenDKP to use ECGs
  - This hardcoded value will be updated to a dynamic one later when guilds are integrated
- Updated the hardcoded list of officers
  - This hardcoded list will be moved into guild logic later when guilds are integrated
- Updated bid commands for bid takers
  - `:bid <ITEM_NAME>` will now start a bid for a given item
  - `:report <ITEM_NAME>` submits any missing items to be added to the list of raid drops

Known Issues
https://github.com/paulwsully/VGina/issues

Help Docs
https://vgina.snazzydocs.com/welcome (Major WIP!)

====================================================================================

### EQPal - v0.5.1

### Changes

- Fixed an issue with .gitignore not properly keeping a folder from being added to the repo. Huge thanks, Grindlord for spotting this!

### Known Issues

https://github.com/paulwsully/VGina/issues

### Help Docs

https://vgina.snazzydocs.com/welcome (Major WIP!)

**Notes**

- This _shouldn't_ impact users still on v0.5.0, but if your voice triggers stop working, just update to v0.5.1 and you should be good to go.

====================================================================================

### VGina - v0.5.0

### Changes

- Added a raid-facing bidding system
  - The live bids can be turned on via the "Alerts and Options"
- Moved all overlay toggles to the "Alerts and Options" tab
- Tags added to the triggers tab to allow for sorting
- Search added to the triggers tab to allow for filtering by trigger name
- Triggers are now paginated to reduce lag when an excessive number of triggers are available
- Many under-the-hood changes to improve code quality and reusability
- Added a visual tracking arrow that turns on when tracking a mob
  - This can be turned on via the "Alerts and Options" tab
- You can now delete triggers
- Updated the general workflow of adding and updating triggers
- Added the `#bid <ITEM_LINK>` command
  - This will put the given item up for bidding to the raid
- Added the `#itemMissing <ITEM_LINK>` command
  - Allows the user to report an item as missing from the database of raid drops
  - You'll know it's missing when it does not display a bidding window either to the bid taker or the raid

### Known Issues

- Can not currently edit tags on a trigger
- Alerts do not account for all spells such as wizard roots
- Feign Death alerts are activated by any failed feign death. Not just your own
- Tags can not be added at the moment
  - Currently tags can only be used when importing from GINA
- Clicking on "Closed Bids" in the "DKP & Loot" tab crashes the program

**Notes**

- You may need to completely delete the vgina folder inside of `C:\Users\<USER>\AppData\Roaming`. Only do this if you encounter issues, as it will delete ALL triggers when doing so.
- This may get flagged by Microsoft as a virus. **It is not.** VGina does nothing that can compromise your system or personal information in any way, shape, or form. If you are uncomfortable installing still, that is fine. I will be setting the repo for source code to public in probably a couple weeks that will be open to peer review, scrutiny, and PRs.

====================================================================================

### VGina - v0.4.1

### Changes

- Overhaul and performance optimizations to the file watching and parsing system.
- GINA triggers can now be imported into VGina
  - This does NOT use the exported formats from GINA, as it does not export all of the fields properly
  - To properly import your triggers, you must go to `C:\Users\<USER>\AppData\Local\GimaSoft\GINA` and import the `GINAConfig.xml` file
  - Please note, I have not reached complete parity with GINA. Some functionality from triggers may not carry across as expected
  - The import button can be found at the top-right of the main window next to the other window controls

### Bug fixes

- More raid drops should now be seen as such when taking in bids for them
- Can now close multiple bids in a row instead of closing one and no longer being able to click the close button unless closing and reopening the bid overlay

**Notes**

- You may need to completely delete the vgina folder inside of `C:\Users\<USER>\AppData\Roaming`. Only do this if you encounter issues, as it will delete ALL triggers when doing so.
- This may get flagged by Microsoft as a virus. **It is not.** VGina does nothing that can compromise your system or personal information in any way, shape, or form. If you are uncomfortable installing still, that is fine. I will be setting the repo for source code to public in probably a couple weeks that will be open to peer review, scrutiny, and PRs.
