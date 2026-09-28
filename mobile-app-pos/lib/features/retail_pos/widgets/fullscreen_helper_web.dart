// ignore: avoid_web_libraries_in_flutter, deprecated_member_use
import 'dart:html' as html;

void enterFullscreen() {
  html.document.documentElement?.requestFullscreen();
}

void exitFullscreen() {
  html.document.exitFullscreen();
}

bool isFullscreen() => html.document.fullscreenElement != null;

Stream<bool> get onFullscreenChange =>
    html.document.onFullscreenChange.map((_) => isFullscreen());
