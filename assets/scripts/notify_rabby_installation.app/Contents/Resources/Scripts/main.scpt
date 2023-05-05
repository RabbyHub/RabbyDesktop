JsOsaDAS1.001.00bplist00�Vscript_'// ObjC.import('Foundation')
var app = Application.currentApplication()
app.includeStandardAdditions = true

// var dialogText = "Install Rabby Desktop"
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
    var step = 0.5
    var theTotal = 100
    Progress.totalUnitCount = theTotal
    Progress.completedUnitCount = 5
    Progress.description = `Progress: ${Progress.completedUnitCount}%`
    Progress.additionalDescription = `Installing Rabby Desktop for you. Please Wait`

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
        nextValue += Math.random() * 10;
      }

      nextValue = Math.round(nextValue)

      var dots = '.'.repeat(i % 4);

      // Increment the progress
      Progress.completedUnitCount = nextValue
      
      Progress.additionalDescription = `Installing Rabby Desktop for you. Please Wait${dots}`
      // Update the progress detail
      Progress.description = `Progress: ${Progress.completedUnitCount}%`

      theWaitTime -= step
      i++
      delay(step)
    }
  } catch (err) {

  } finally {
    // app.quit()
  }
})();                              = jscr  ��ޭ