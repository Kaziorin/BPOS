// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;
import 'dart:js' as js;


bool isFullscreen() {
  try {
    if (html.document.fullscreenElement != null) return true;
  } catch (_) {}
  try {
    final doc = js.context['document'];
    if (doc != null) {
      if (doc['fullscreenElement'] != null) return true;
      if (doc['webkitFullscreenElement'] != null) return true;
      if (doc['mozFullScreenElement'] != null) return true;
      if (doc['msFullscreenElement'] != null) return true;
    }
  } catch (_) {}
  return false;
}

void enterFullscreen() {
  try {
    final docEl = html.document.documentElement;
    if (docEl != null) {
      docEl.requestFullscreen();
      return;
    }
  } catch (_) {}
  try {
    final doc = js.context['document'];
    final docEl = doc?['documentElement'];
    if (docEl != null) {
      if (docEl['requestFullscreen'] != null) {
        docEl.callMethod('requestFullscreen', []);
      } else if (docEl['webkitRequestFullscreen'] != null) {
        docEl.callMethod('webkitRequestFullscreen', []);
      }
    }
  } catch (_) {}
}

void exitFullscreen() {
  try {
    html.document.exitFullscreen();
    return;
  } catch (_) {}
  try {
    final doc = js.context['document'];
    if (doc != null) {
      if (doc['exitFullscreen'] != null) {
        doc.callMethod('exitFullscreen', []);
      } else if (doc['webkitExitFullscreen'] != null) {
        doc.callMethod('webkitExitFullscreen', []);
      }
    }
  } catch (_) {}
}

void toggleFullscreen() {
  if (isFullscreen()) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
}

Stream<bool> get onFullscreenChange =>
    html.document.onFullscreenChange.map((_) => isFullscreen());
