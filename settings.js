// Make a subclass of ProcessDialog
function SectionSummarizerSettingsDialog(config) {
  SectionSummarizerSettingsDialog.super.call(this, config);
}
OO.inheritClass(SectionSummarizerSettingsDialog, OO.ui.ProcessDialog);

SectionSummarizerSettingsDialog.static.name = "sectionSummarizerSettings";
SectionSummarizerSettingsDialog.static.title = "Summarizer Settings";
SectionSummarizerSettingsDialog.static.actions = [
  {
    flags: ["primary", "progressive"],
    label: "Save",
    action: "save",
  },
  {
    flags: "safe",
    label: "Cancel",
  },
];

// Customize the initialize() function to add content and layouts:
SectionSummarizerSettingsDialog.prototype.initialize = function () {
  SectionSummarizerSettingsDialog.super.prototype.initialize.call(this);
  this.panel = new OO.ui.PanelLayout({
    padded: true,
    expanded: false,
  });

  this.content = new OO.ui.FieldsetLayout();

  this.aiEngineRadioSelect = new OO.ui.RadioSelectWidget();

  this.aiEngineOptions = [
    { data: "gpt-4", label: "OpenAI GPT-4" },
    { data: "gpt-3.5-turbo", label: "OpenAI GPT-3.5" },
  ];

  this.aiEngineOptions.forEach((option) => {
    const radioOption = new OO.ui.RadioOptionWidget({
      data: option.data,
      label: option.label,
    });
    this.aiEngineRadioSelect.addItems([radioOption]);
  });

  this.aiEngineField = new OO.ui.FieldLayout(this.aiEngineRadioSelect, {
    label: "AI Engine",
    align: "top",
  });

  this.apiKeyInput = new OO.ui.TextInputWidget({
    placeholder: "Enter your OpenAI API key",
  });

  this.apiKeyField = new OO.ui.FieldLayout(this.apiKeyInput, {
    label: "OpenAI API Key",
    align: "top",
  });

  this.content.addItems([this.aiEngineField, this.apiKeyField]);
  this.panel.$element.append(this.content.$element);
  this.$body.append(this.panel.$element);
};

// Specify the dialog height (or don't to use the automatically generated height).
// SectionSummarizerSettingsDialog.prototype.getBodyHeight = function () {
//     return this.panel.$element.outerHeight(true);
// };

// Use getSetupProcess() to set up the window with data passed to it at the time
// of opening (e.g., url: 'http://www.mediawiki.org', in this example).
SectionSummarizerSettingsDialog.prototype.getSetupProcess = function (data) {
  data = data || {};
  return SectionSummarizerSettingsDialog.super.prototype.getSetupProcess
    .call(this, data)
    .next(function () {
      // Set up contents based on data
      this.aiEngineRadioSelect.selectItemByData(
        localStorage.getItem("mw_summarizer_aiEngine") || "gpt-3.5"
      );
      this.apiKeyInput.setValue(
        localStorage.getItem("mw_summarizer_apiKey") || ""
      );
    }, this);
};

// Specify processes to handle the actions.
SectionSummarizerSettingsDialog.prototype.getActionProcess = function (action) {
  if (action === "save") {
    // Create a new process to handle the action
    return new OO.ui.Process(function () {
      localStorage.setItem(
        "openAiKey",
        this.aiEngineRadioSelect.getSelectedItem().getData()
      );
      localStorage.setItem("openAiKey", this.apiKeyInput.getValue());
    }, this);
  }
  // Fallback to parent handler
  return SectionSummarizerSettingsDialog.super.prototype.getActionProcess.call(
    this,
    action
  );
};

// Create and append a window manager.
var windowManager = new OO.ui.WindowManager();
$(document.body).append(windowManager.$element);

// Create a new process dialog window.
var settingsDialog = new SectionSummarizerSettingsDialog();

// Add the window to window manager using the addWindows() method.
windowManager.addWindows([settingsDialog]);

// Open the window!
windowManager.openWindow(settingsDialog);
