// Stub for non-web platforms
void enterFullscreen() {}
void exitFullscreen() {}
void toggleFullscreen() {}
bool isFullscreen() => false;
Stream<bool> get onFullscreenChange => const Stream.empty();
