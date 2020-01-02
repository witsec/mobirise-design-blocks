(function(jQuery, mbrApp) {

	var curr;
    mbrApp.regExtension({
        name: "witsec-design-blocks",
        events: {		
            load: function() {
                var a = this;

				// Add button to navbar to open the Design Blocks Gallery
				a.$body.find(".navbar-devices").append('<li class="btnDesignBlocksGallery" style="width:66px; height:58px; cursor:pointer" data-tooltipster="bottom" title="Design Blocks Gallery"><i class="mbr-icon-image-gallery mbr-iconfont"></i></li>');

				// Handler for Gallery button
				a.$body.on("click", ".btnDesignBlocksGallery", function(b) {
					// Create the query string
					var qs = "version=3.0&type=" + (mbrApp.isAMP() ? "amp" : "bootstrap")

					// Gallery URL
					var url = "https://witsec.nl/mobirise/gallery/embed.php?" + qs;

					// Try to grab the HTML of the Design Blocks Gallery (we need to do a synchronous call here)
					var html = "";
					var request = $.ajax({ url: url, dataType: "text", async: false });
					request.error(function(jqXHR, textStatus, errorThrown) { html = "An error occured while loading the Design Blocks Gallery. Please try again later."; });
					request.success(function(result) { html = result; });

					// Custom styling for Design Blocks Gallery
					var css = `
					<style>
					.witsec-blocks {
					  height: ` + Math.ceil(window.innerHeight * 0.5) + `px;
					}
					</style>`;

					// Display the Gallery
					mbrApp.showDialog({
						title: "Design Blocks Gallery",
						className: "witsec-modal",
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

									// Try to grab the block (we need to do a synchronous call here)
									var request = $.ajax({ url: blockURL, dataType: "text", async: false });

									// On failure
									request.error(function(jqXHR, textStatus, errorThrown) {
										if (textStatus == "timeout")
											m = "The server is not responding.";

										if (textStatus == "error")
											m = "An error occured while loading the block. " + errorThrown;

										mbrApp.alertDlg(m);
										return false;
									});

									// On success
									var result = "";
									request.success(function(res) {
										result = res;
									});

									// Double check if we were successful in retrieving the file
									if (result == "") {
										mbrApp.alertDlg("An unknown error occured while loading the block.");
										return false;
									}

									// Validate JSON
									var json = "";
									try {
										json = jQuery.parseJSON(result);
									}
									catch(e) {
										mbrApp.alertDlg("The block you selected does not appear to be valid JSON.");
										return false;
									}

									// Let's do some more checks
									var error = "";
									var warn = "";
									if (!json.hasOwnProperty('data'))
										error = "The block does not contain the required field 'data'.";

									// Check if _styles exists (doesn't have to be there)
									if (!json.data.hasOwnProperty('_styles'))
										json.data._styles = {};

									// Check _customHTML
									if (!json.data.hasOwnProperty('_customHTML'))
										error = "The block does not contain the required field '_customHTML'.";
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

									// If there's an error, show it and return
									if (error) {
										mbrApp.alertDlg(error);
										return false;
									}

									// If there's a warning, show it and continue
									if (warn) {
										mbrApp.alertDlg("There are one or more warnings:<br /><br /><ul>" + warn + "</ul>");
									}

									// Generate a new _cid
									var cid = "";
									var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
									for (var i = 0; i < 10; i++) {
										cid += chars.charAt(Math.floor(Math.random() * chars.length));
									}

									// Create an object for the new block
									var newBlock = {
										_alias: false,
										_styles: json.data._styles,
										_name: "design-block",
										_customHTML: json.data._customHTML,
										_cid: cid,
										_protectedParams: [],
										_global: false,
										_once: false,
										_params: {},
										_anchor: "design-block-" + cid
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
								catch(err){
									mbrApp.alertDlg(err.name + ', ' +err.message);
								}
							}
						}
						]
					});
				});

				// Respond to clicking on the browse button
				a.$body.on("click", "#witsec-custom-block-browse", function() {
					Bridge.runFileDialog("Select Design Block",mbrApp.projectPath,"Design Blocks (*.json *.js)",function(c){
						$("#witsec-custom-block").val(c);
					});
				});

				// Do things on publish
                a.addFilter("publishHTML", function(b) {
					// Remove any code before DOCTYPE (don't worry, we'll put it back later)
					var pattern = /^([\w\W]*?)<!DOCTYPE html>/mi;
					var beforeDocType = b.match(pattern);
					b = b.replace(pattern, "");

					// Rename html/head/body elements and remove DOCTYPE, so we don't lose them when we want to get them back from jQuery (there must be a better way, right?)
					b = b.replace(/<!DOCTYPE html>/igm, "");
					b = b.replace(/<([/]?)(html|head|body)/igm, "<$1$2x");

					// Hide PHP using HTML comment tags, as jQuery doesn't understand these tags and distorts them beyond repair
					b = b.replace(/(<\?[\w\W]+?\?>)/gmi, "<!--$1-->");

					// Let's remove the elements that should be removed on publish
					j = $(b);
					j.find(".remove-on-publish").remove();
					b = j.prop("outerHTML");

					// Restore PHP tags to their former glory
					b = b.replace(/<!--(<\?[\w\W]+?\?>)-->/gmi, "$1");

					// Rename the elements back
					b = b.replace(/<([/]?)(html|head|body)x/igm, "<$1$2");

					// re-add code (if any) before DOCTYPE, including DOCTYPE itself
					b = (beforeDocType ? beforeDocType[1] : "") + "<!DOCTYPE html>\n" + b;

					return b
				});

            }
        }
    })
})(jQuery, mbrApp);