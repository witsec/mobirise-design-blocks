mbrApp.loadComponents(
	"witsec-design-blocks",
	{"witsec-design-blocks-block":{
			_group:"witsec",

			_onParamsShow: function(e,$params,$block) {
			},

			// When you activate this block, Mobirise will restart automatically.
			_params:{
				notice:      {type:"separator",title:"<a href='https://witsec.nl/mobirise/gallery' target='_blank' class='alert alert-light' style='cursor:hand; color:#000; text-decoration:none'>Design Blocks Gallery</a><br /><br />"},
				templateURL: {type:"text",title:"Template (paste here)",default:""},
				activate:    {type:"switch",title:"Activate block",default:!1,condition:["templateURL"]}
			},

			_message: "Use the gear icon to access the Design Blocks Gallery or paste the location of your own template.",

			_onParamsChange:function($item, param, val){
				if (param == "activate" && val == true) {
					// We add a random number to the URL, to avoid any caching
					var templateURL = this._params.templateURL + "?" + Math.floor(Math.random() * 10000);

					// Try to grab the template
					var request = $.ajax({ url: templateURL, dataType: "text" });

					// On failure
					request.error(function(jqXHR, textStatus, errorThrown) {
						if (textStatus == "timeout")
							m = "The server is not responding.";

						if (textStatus == "error")
							m = "An error occured while loading the template. " + errorThrown;

						mbrApp.alertDlg(m);
						return false;
					});

					// The "success" function needs to be able to access "this", so making a variable for it
					var block = this;
					
					// On success
					request.success(function(result) {
						// Validate JSON
						var json = "";
						try {
							json = jQuery.parseJSON(result);
						}
						catch(e) {
							mbrApp.alertDlg("The template you selected does not appear to be valid JSON.");
							return false;
						}

						// Let's do some more checks
						var m = "";
						if (!json.templateVersion)
							m = "The template does not contain the required field 'version'.";
						if (json.templateVersion != 1)
							m = "The template has a version number that's incompatible with this version of the extension.";
						if (!json._customHTML)
							m = "The template does not contain the required field '_customHTML'.";
						if (!json._styles)
							m = "The template does not contain the required field '_styles'.";

						// If there's an error, show it and return
						if (m) {
							mbrApp.alertDlg(m);
							return false;
						}

						// Delete and create some things to make this block fully customizable
						delete block.alias;
						delete block._params;
						delete block._tags;
						block._customHTML = json._customHTML;
						block._styles = json._styles;

						// Let the user know what's going on
						block._message = "Block is prepared. Mobirise will restart in a few seconds...";

						// Reload the current project. Required in order to be able to fully use this new block
						setTimeout(function() {
							mbrApp.loadRecentProject();
						}, 4000)
					});
				}
			}
		}
	}
);