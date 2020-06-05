defineM("witsec-design-blocks", function(jQuery, mbrApp, TR) {

	var curr;
    mbrApp.regExtension({
        name: "witsec-design-blocks",
        events: {		
            load: function() {
                var a = this;

				// Check if current theme is an old M/M3 theme
				if (mbrApp.theme.type === "primary")
					return false;

				// Add button to navbar to open the Design Blocks Gallery
				a.$body.find(".navbar-devices").append('<li class="btnDesignBlocksGallery" style="width:66px; height:58px; cursor:pointer" data-tooltipster="bottom" title="Design Blocks Gallery"><i class="mbr-icon-cubes mbr-icon-image-gallery mbr-iconfont"></i></li>');

				// Handler for Gallery button
				a.$body.on("click", ".btnDesignBlocksGallery", function(b) {

					// Restore view (so block menu keeps working)
					$(".navbar-devices > li[data-device='desktop'] > a").trigger("click");

					// Try to grab the HTML of the Design Blocks Gallery
					$.ajax({
						url: "https://witsec.nl/mobirise/gallery/embed.php?" + "version=8.0&type=" + (mbrApp.isAMP() ? "amp" : "bootstrap"),
						success: function (result) {
							ShowGallery(result);
						},
						error: function (result) {
							mbrApp.alertDlg("The Design Blocks Gallery seems to be unavailable at the moment.<br>Please try again later.");
						},
					});
				});

				// Respond to clicking on the browse button
				a.$body.on("click", "#witsec-custom-block-browse", function() {
					Bridge.runFileDialog("Select Design Block",mbrApp.projectPath,"Design Blocks (*.json *.js)",function(c){
						$("#witsec-custom-block").val(c);
					});
				});

				// Show the Gallery
				function ShowGallery(html) {
					// Custom styling for Design Blocks Gallery
					var css = `
					<style>
					.witsec-gallery-modal .modal-dialog {
						width: 80%;
					}
					.witsec-blocks {
					  height: ` + Math.ceil(window.innerHeight * 0.5) + `px;
					}
					</style>`;

					// Display the Gallery
					mbrApp.showDialog({
						title: "Design Blocks Gallery",
						className: "witsec-gallery-modal",
						body: [
							css,
							'<div id="witsec-design-blocks-gallery">',
							html,
							'</div><br />',
							'<form class="form-inline">',
							'<div class="form-group">',
							'  <input type="text" class="form-control" id="witsec-custom-block" placeholder="Paste URL or click browse" value="" />',
							'  <button class="btn btn-primary" type="submit" id="witsec-custom-block-browse">BROWSE</button>',
							'</form>',
							'</div>'
							].join("\n"),
						buttons: [
						{
							label: "CANCEL",
							default: !1,
							callback: function () {
							}
						},
						{
							label: "ADD BLOCK TO PAGE",
							default: !0,
							callback: function() {
								try {
									// Grab the block URL
									var blockURL = ( $("#witsec-custom-block").val() != "" ? $("#witsec-custom-block").val() : $("#witsec-selected-block").val() );

									// Download the selected block (and everything else from the component.js)
									if (blockURL == "") {
										mbrApp.alertDlg("Please select a Design Block.");
										return false;
									}

									// Try to grab the block
									$.ajax({
										url: blockURL,
										dataType: "text",
										success: function (result) {
											ImportDesignBlock(result);
										},
										error: function (result) {
											mbrApp.alertDlg("An error occured, the selected Design Block could not be downloaded from the Gallery.");
										},
									});
								}
								catch(err){
									mbrApp.alertDlg(err.name + ', ' +err.message);
								}
							}
						}
						]
					});
				}

				// Import the downloaded Design Block into the page
				function ImportDesignBlock(result) {
					// Validate JSON
					var json = "";
					try {
						json = JSON.parse(result);
					}
					catch(e) {
						mbrApp.alertDlg("The block you selected does not appear to be valid JSON.");
						return false;
					}

					// Let's do some more checks
					var warn = "";
					if (!json.hasOwnProperty("data")) {
						mbrApp.alertDlg("The block does not contain the required field 'data'.");
						return false;
					}

					// Check if _styles exists (doesn't have to be there)
					if (!json.data.hasOwnProperty("_styles"))
						json.data._styles = {};

					// Check _customHTML
					if (!json.data.hasOwnProperty('_customHTML')) {
						mbrApp.alertDlg("The block does not contain the required field '_customHTML'.");
						return false;
					}
					else {
						if (!json.data._customHTML.match(/<mbr-parameters>/i)) {
							warn += "<li>There don't appear to be any parameters inside the '_customHTML' field. This means you will not be able to customize this block using the 'gear icon'.</li>";
						}
					}

					// In case the block is a custom html block created with the Code Editor, try to convert the CSS into JSON
					if (json.data.hasOwnProperty('_customCSS') && json.data._customCSS != "" && json.data._customTemplate) {
						// _customCSS exists, but _styles is empty, so let's try to convert CSS to JSON here
						var css = json.data._customCSS;

						// Delete all tabs and break lines
						css = css.replace(/[\r\n\t]+/gm, "");

						// Put "}", ";" and "{" on new lines
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

						// Add trailing commas after "}", but remove the ones before "{" and the one at the very end
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
							warn += "<li>There was an issue processing the '_customCSS' field. The block will be imported, but it may have styling issues.</li>";
						}
					}

					// If there's a warning, show it and continue
					if (warn) {
						mbrApp.alertDlg("There are one or more warnings:<br /><br /><ul>" + warn + "</ul>");
					}

					// Create an object for the new block
					var cid = GenerateCID();
					var newBlock = {
						"alias":            false,
						"_styles":          json.data._styles,
						"_name":            "design-block",
						"_customHTML":      json.data._customHTML,
						"_cid":             cid,
						"_protectedParams": [],
						"_global":          false,
						"_once":            false,
						"_params":          {},
						"_anchor":          "design-block-" + cid
					};

					// Create a new component on the current page
					var currentPage = mbrApp.Core.currentPage;
					var size = mbrApp.Core.resultJSON[currentPage].components.length;
					mbrApp.Core.resultJSON[currentPage].components[size] = newBlock;

					// Save the project
					mbrApp.runSaveProject(function() {
						mbrApp.loadRecentProject(function(){
							$("a[data-page='" + currentPage + "']").trigger("click");
						});
					});
				}

				// Function to generate a component ID
				function GenerateCID() {
					var cid = "";
					var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

					// Loop until we get a unique CID (usually one go needed, but there's a super small chance you end up with a CID that already exists)
					while (cid == "") {
						// Generate random string
						for (var i = 0; i < 10; i++) {
							cid += chars.charAt(Math.floor(Math.random() * chars.length));
						}

						// Let's check if that CID already exists anywhere else in the project
						var pages = mbrApp.Core.getPages();
						for(var page in pages) {
	
							// Loop through all components of a page
							for (i=0; i<pages[page]["components"].length; i++) {
								if (cid == pages[page]["components"][i]["_cid"]) {
									cid = "";
									break;
								}
							}

							// If CID is empty, we need to start over, so exit this loop
							if (cid == "")
								break;
						}
					}

					// We're here, so we got ourselves a unique CID
					return cid;
				}
            }
        }
    })
}, ["jQuery", "mbrApp", "TR()"]);