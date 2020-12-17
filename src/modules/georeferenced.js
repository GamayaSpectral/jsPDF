/** ====================================================================
 * @license
 * jsPDF Geo Referenced plugin
 * Copyright (c) 2020 Alexander Musienko, dnepromell@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ====================================================================
 */

import {jsPDF} from "../jspdf";

(function(jsPDFAPI) {
  "use strict";
  var _pagesBounds = [], pages = {};
  /**
   * @name addGeoReferenced
   * @function
   * @param {array} GPTS coordinates for pages [[[lower left lat, lower left lon], [upper left], [upper right], [lower right]], [page2 coordinates...]].
   * @returns {jsPDF}
   */

  jsPDFAPI.addGeoReferenceForPages = function(pagesBounds) {
    _pagesBounds = pagesBounds;

    var putResourceForPage = function (gpts, number) {
      // var bounds = [0, 1, 0, 0, 1, 0, 1, 1];
      var bounds = [0, 0, 0, 1, 1, 1, 1, 0];
      var gptsLine = "";
      for (var i = 0; i < gpts.length; i++) {
        gptsLine += " " + [gpts[i][1], gpts[i][0]].join(" ");
      }

      this.internal.newObjectDeferredBegin(pages[number].bboxObj, true);
      this.internal.out("<<");
      this.internal.out("/BBox [ " + pages[number].bbox.join(" ") + " ]");
      this.internal.out("/Measure " + pages[number].gcsObj + " 0 R");
      this.internal.out("/Type /Viewport");
      this.internal.out(">>");
      this.internal.out("endobj");

      this.internal.newObjectDeferredBegin(pages[number].gcsObj, true);
      this.internal.out("<<");
      this.internal.out("/Bounds [ " + bounds.join(' ') + " ]");
      this.internal.out("/GCS " + pages[number].epsgObj + " 0 R");
      this.internal.out("/GPTS [" + gptsLine + " ]");
      this.internal.out("/LPTS [ " + bounds.join(' ') + " ]");
      this.internal.out("/Subtype /GEO");
      this.internal.out("/Type /Measure");
      this.internal.out(">>");
      this.internal.out("endobj");

      this.internal.newObjectDeferredBegin(pages[number].epsgObj, true);
      this.internal.out("<<");
      this.internal.out("/EPSG 4326");
      this.internal.out("/Type /GEOGCS /WKT (GEOGCS[\"GCS_WGS_1984\",DATUM[\"D_WGS_1984\",SPHEROID[\"WGS_1984\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"Degree\",0.017453292519943295]])");
      this.internal.out(">>");
      this.internal.out("endobj");
    };

    this.internal.events.subscribe("buildDocument", function() {
      pages = [];
    });

    this.internal.events.subscribe("putPage", function(page) {
      if (!pages[page.pageNumber] && _pagesBounds[page.pageNumber - 1]) {
        pages[page.pageNumber] = {
          bboxObj: this.internal.newObjectDeferred(),
          gcsObj: this.internal.newObjectDeferred(),
          epsgObj: this.internal.newObjectDeferred(),
          bbox: [
              page.pageContext.mediaBox.bottomLeftX,
              page.pageContext.mediaBox.bottomLeftY,
              page.pageContext.mediaBox.topRightX,
              page.pageContext.mediaBox.topRightY
          ]
        };
        this.internal.out("/VP [ " + pages[page.pageNumber].bboxObj + " 0 R ]");
      }
    });

    this.internal.events.subscribe("postPutResources", function() {
      for (var i = 0; i < _pagesBounds.length; i++) {
        if (_pagesBounds[i]) {
          putResourceForPage.call(this, _pagesBounds[i], i + 1);
        }
      }
    });

    return this;
  };
})(jsPDF.API);
