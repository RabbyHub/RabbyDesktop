JsOsaDAS1.001.00bplist00�Vscript_nObjC.import('Foundation')
var app = Application.currentApplication()
app.includeStandardAdditions = true

// var dialogText = "Installing Rabby"
// app.displayDialog(dialogText, {
// 	buttons: ['', ''],
//   title: "Installing Rabby",
//   giveUpAfter: 0,
// 	// withIcon: "",
// });

;(() => {
  try {
    // Update the initial progress information
    var theWaitTime = 7
    var step = 1
    var theTotal = 100
    Progress.totalUnitCount = theTotal
    Progress.completedUnitCount = 5
    Progress.description = `Processing Update...`
    Progress.additionalDescription = "Preparing to process."

    var i = 0
    while (theWaitTime > 0) {
      // average 1 second per step
      // var nextValue = Math.floor((i / theWaitTime) * theTotal)

      var prevValue = Progress.completedUnitCount
      var nextValue = Progress.completedUnitCount
      
      if (prevValue > 99) {
        nextValue += 0.01;
      } else if (nextValue > 80) {
        nextValue += 1;
      } else {
        nextValue += Math.random() * 20;
      }

      nextValue = Math.round(nextValue)

      // Update the progress detail
      Progress.additionalDescription = "Progress: " + nextValue + " of " + theTotal
      // Increment the progress
      Progress.completedUnitCount = nextValue

      theWaitTime -= step
      i++
      delay(step)
    }
  } catch (err) {

  } finally {
    app.quit()
  }
})();                              �jscr  ��ޭ