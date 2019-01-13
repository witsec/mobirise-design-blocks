mbrApp.loadComponents(
	"witsec-design-blocks",
	{"witsec-design-blocks-block":{
			_group:"witsec",

			_onParamsShow: function(e,$params,$block) {
			},

			// When you activate this block, Mobirise will restart automatically.
			_params:{
				notice:      {type:"separator",title:"<a href='https://witsec.nl/mobirise/gallery/?version=0.3&type=" + (mbrApp.isAMP() ? "amp" : "bootstrap") + "&random=" + Math.floor(Math.random() * 100000000) + "' target='_blank' class='alert alert-light' style='cursor:hand; color:#000; text-decoration:none'>Design Blocks Gallery</a><br /><br />"},
				templateURL: {type:"text",title:"Template (paste here)",default:""},
				activate:    {type:"switch",title:"Activate block",default:!1,condition:["templateURL"]}
			},

			_message: "Use the gear icon to access the Design Blocks Gallery or paste the location of your own template.",

			_onParamsChange:function($item, param, val){
				if (param == "activate" && val == true) {
					// We add a random number to the URL, to avoid any caching
					var templateURL = this._params.templateURL + "?" + Math.floor(Math.random() * 100000000);

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
						var error = "";
						var warn = "";
						if (!json.hasOwnProperty('data'))
							error = "The template does not contain the required field 'data'.";

						// Check if _styles exists (doesn't have to be there)
						if (!json.data.hasOwnProperty('_styles'))
							json.data._styles = {};

						// Check _customHTML
						if (!json.data.hasOwnProperty('_customHTML'))
							error = "The template does not contain the required field '_customHTML'.";
						else {
							if (!json.data._customHTML.match(/<mbr-parameters>/i)) {
								warn += "<li>There don't appear to be any parameters inside the '_customHTML' field. This means you will not be able to customize this block using the 'gear icon'.</li>";
							}
						}

						// In case the template is a custom html block created with the Code Editor, try to convert the CSS into JSON
						if (json.data.hasOwnProperty('_customCSS') && json.data._customCSS != "" && json.data._customTemplate) {
							// _customCSS exists, but _styles is empty, so let's try to convert CSS to JSON here
							var css = json.data._customCSS;

							// Put everything on new lines
							css = css.replace(/[\r\n\t]+/gm, "");
							css = css.replace(/([};]{1})/gm, "\n$1\n");
							css = css.replace(/{/gm, "{\n");

							// Remove leading and trailing spaces
							css = css.replace(/^ +/gm, '');
							css = css.replace(/ +$/gm, '');

							// Add double quotes
							css = css.replace(/^(.+) *: *(.+)/gm, '"$1":"$2"');
							css = css.replace(/(.+){/gm, '"$1": {');

							// Replace trailing semicolon with a comma
							css = css.replace(/;$/gm, ',');

							// Remove all new lines
							css = css.replace(/\n/gm, "")

							// Add trailing commas, but remove the ones before a closing bracket and the one at the very end
							css = css.replace(/}/gm, "},")
							css = css.replace(/,([ \\n]*})/gm, "$1");
							css = css.replace(/(.+),[ \\n]*$/gm, "$1");

							// Add brackets and we're done
							css = "{" + css + "}";

							try {
								var jsoncss = jQuery.parseJSON(css);
								json.data._styles = jsoncss;
							}
							catch(e) {
								warn += "<li>There was an issue processing the '_customCSS' field. The template will be imported, but it may have styling issues.</li>";
							}
						}

						// If there's an error, show it and return
						if (error) {
							mbrApp.alertDlg("<b>Invalid template</b><br /><br />" + error);
							return false;
						}

						// If there's a warning, show it and continue
						if (warn) {
							mbrApp.alertDlg("There are one or more warnings:<br /><br /><ul>" + warn + "</ul>");
						}

						// Delete and create some things to make this block fully customizable
						delete block.alias;
						delete block._params;
						delete block._tags;
						block._styles = json.data._styles;
						block._customHTML = json.data._customHTML;

						// Let the user know what's going on
						block._message = "Block is prepared. Mobirise will reload this project in a few seconds... <img src='" + mbrApp.getAddonsDir() + "/witsec-design-blocks/witsec-design-blocks-block/waiting.gif' />";

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