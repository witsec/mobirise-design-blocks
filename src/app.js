(function(jQuery, mbrApp) {

	var curr;
    mbrApp.regExtension({
        name: "witsec-design-blocks",
        events: {		
            load: function() {
                var a = this;

				a.$body.on("click", ".witsec-show-design-gallery", function(b) {
					// Hide the params modal
					mbrApp.hideComponentParams();

					// Create the query string
					var qs = "version=0.6&type=" + (mbrApp.isAMP() ? "amp" : "bootstrap")

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

					// Show the Design Blocks Gallery
					mbrApp.showDialog({
						title: "Design Blocks Gallery",
						className: "witsec-modal",
						body: [
							css,
							'<div id="witsec-design-blocks-gallery">',
							html,
							'</div>'
						].join("\n"),
						buttons: [{
							label: "ACTIVATE SELECTED BLOCK",
							default: !0,
							callback: function() {
								// Check if a block has indeed been selected
								if ($('#witsec-selected-block').val() == "") {
									mbrApp.alertDlg("No block was selected.");
									return false;
								}

								// Set the URL and tell Mobirise the input has changed
								$('input[name="witsecBlockURL"]').val( $('#witsec-selected-block').val() );
								$('input[name="witsecBlockURL"]').change();

								// Make sure the "activate" switch is unchecked
								$('input[name="witsecBlockActivate"]').prop("checked", false);

								// Wait a little while before "clicking" the activate switch. If we don't do this, the chance of the block not actually activating is much higher than usual
								setTimeout(function() {
									$('input[name="witsecBlockActivate"]').click();
								}, 1000);
							}
						},
						{
							label: "CANCEL",
							default: !0,
							callback: function () {
							}
						}
						]
					});
				});

				// When the document is ready, we're going to try to make this block available to the user. This is very very dirty, but until we find a better way this'll have to do...
				$(document).ready(function() {
					// Only do this for AMP
					if (mbrApp.isAMP()) {

						// Create the UL
						var ul = `
							<h5 data-group="witsec">witsec</h5>
							<ul class="witsec-components-group">
							</ul>
						`;

						// Create the LI
						var li = `
							<li class="witsec-design-blocks-component" data-layer="add-component" data-filter="Extension">
								<a href="javascript:void(0)" data-component="witsec-design-blocks-block">
								<img src="` + mbrApp.getAddonsDir() + `/witsec-design-blocks/witsec-design-blocks-block/thumb.png" alt="witsec-design-blocks-block"></a>
							</li>
						`;

						// Trigger the "add block to page" button, so we can add the Design Blocks block to the extensions list. Then close it again using the toggle function.
						// Also the ".ext-link" class is used in another window (new project), which we don't want to disturb.
						$(".app-components-toggle").trigger("click");
						mbrApp.toggleComponentsList();

						// Try to add this block to Mobirise
						var tries = 20;
						var checkExist = setInterval(function() {
							// We only try this x times
							if (tries == 0) {
								clearInterval(checkExist);
								return false;
							}

							// Check if the components group "witsec" exists already. If not, add it
							if ($(".witsec-components-group").length) {
								// Check if the component exists already. If not, add it
								if ($(".witsec-design-blocks-component").length) {
									clearInterval(checkExist);
								}
								else {
									$(".witsec-components-group").append(li);
								}								
							}
							else {
								// Insert this before the "Add Block" button
								$(ul).insertBefore(".ext-link");
							}
							tries--;
						}, 1000);
					}
				});

                a.addFilter("publishHTML", function(b) {
					// Rename html/head/body elements and remove DOCTYPE, so we don't lose them when we want to get them back from jQuery (there must be a better way, right?)
					b = b.replace(/<!DOCTYPE html>/igm, "");					
					b = b.replace(/<([/]?)(html|head|body)/igm, "<$1$2x");

					// Let's remove the elements that should be removed on publish
					j = $(b);
					j.find(".remove-on-publish").remove();
					b = j.prop('outerHTML');

					// Rename the elements back	and re-add DOCTYPE				
					b = b.replace(/<([/]?)(html|head|body)x/igm, "<$1$2");
					b = "<!DOCTYPE html>\n" + b;

					// Restore crippled PHP tags
					b = b.replace(/<!--\?/igm, "<?");
					b = b.replace(/\?-->/igm, "?>");

					return b
				});

            }
        }
    })
})(jQuery, mbrApp);