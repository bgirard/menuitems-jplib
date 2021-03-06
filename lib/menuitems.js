/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2010 Erik Vold
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

const windowUtils = require("window-utils");
const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

var Menuitem = function Menuitem(options) {
  if (!(this instanceof Menuitem)) {
    return new Menuitem(options);
  }

  var menuitems = [];
  var menuitem = null;

  this.__defineGetter__("checked", function() {
    return menuitem.getAttribute("checked");
  });
  this.__defineSetter__("checked", function(val) {
    menuitem.setAttribute("checked", val);
  });

  var label = options.label+"";
  this.__defineGetter__("label", function() {
    return label;
  });
  this.__defineSetter__("label", function(val) {
    label = val;
    menuitems.forEach(function(menuitem) {
      if (!menuitem) return;
      menuitem.setAttribute("label", label);
    });
    return label;
  });

  var disabled = !!(options.disabled || false);
  this.__defineGetter__("disabled", function() {
    return disabled;
  });
  this.__defineSetter__("disabled", function(val) {
    disabled = !!val;
    menuitems.forEach(function(menuitem) {
      if (!menuitem) return;
      menuitem.setAttribute("disabled", disabled+"");
    });
    return disabled;
  });

  // setup window tracker
  windowUtils.WindowTracker({
    onTrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location) return;

      var onCmd = function(e) {
        return options.onCommand && options.onCommand(e);
      };

      // add the new menuitem to a menu
      menuitem = window.document.createElementNS(NS_XUL, options.isMenu ? "menu" : "menuitem");
      menuitem.setAttribute("id", options.id);
      if (!options.isMenu) {
        menuitem.setAttribute("type", "checkbox");
        menuitem.setAttribute("checked", true);
      }
      var menuitems_i = menuitems.push(menuitem) - 1;

      menuitem.setAttribute("label", label);

      if (options.accesskey)
        menuitem.setAttribute("accesskey", options.accesskey);
      if (options.key)
        menuitem.setAttribute("key", options.key);
      if (options.image) {
        menuitem.setAttribute("class", "menuitem-iconic");
        menuitem.style.listStyleImage = "url('" + options.image + "')";
      }
      menuitem.addEventListener("command", onCmd, true);

      if (options.isMenu) {
        var menupopup = window.document.createElementNS(NS_XUL, "menupopup");
        menupopup.setAttribute("id", options.id + "_popup");
        menuitem.appendChild(menupopup);
      }

      if (options.menuid) {
        let $ = function(id) window.document.getElementById(id);

        if (options.menuid.length) {
            for (var len = options.menuid.length, i = 0; i < len; i++) {
              let parent = $(options.menuid[i]);
              if (parent && menuitem) {
                if (options.isTopLevelMenu) {
                  parent.parentNode.appendChild(menuitem);
                } else if (!insertBefore(window, parent, options.insertbefore)) {
                  parent.appendChild(menuitem);
                } else {
                  parent.insertBefore(menuitem, insertBefore(window, parent, options.insertbefore));
                }
                break;
              } else {
                dump("Menuid not found: " + options.menuid[i] + "\n");
              }
            }
        }
        else {
          $(options.menuid).insertBefore(menuitem, insertBefore(window, parent, options.insertbefore));
        }
      }

      // add unloader
      require("unload+").unload(function() {
        menuitem.parentNode.removeChild(menuitem);
        menuitems[menuitems_i] = null;
      }, window);
    }
  });

  return this;
};

function insertBefore(window, parent, insertBefore) {
  let $ = function(id) window.document.getElementById(id);
  if (typeof insertBefore == "number") {
    switch (insertBefore) {
    case Menuitem.FIRST_CHILD:
      return parent.firstChild;
    }
    return null;
  }
  return $(insertBefore) || parent.firstChild;
}

Menuitem.FIRST_CHILD = 1;

exports.Menuitem = Menuitem;
