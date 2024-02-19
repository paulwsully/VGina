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
