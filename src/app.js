(function(jQuery, mbrApp) {

	var curr;
    mbrApp.regExtension({
        name: "witsec-design-blocks",
        events: {		
            load: function() {
                var a = this;

				// When the document is ready, we're going to try to make this block available to the user. This is a very very dirty, but until we find a better way this'll have to do...
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

					return b
				});

            }
        }
    })
})(jQuery, mbrApp);