// Stub for non-web platforms
void enterFullscreen() {}
void exitFullscreen() {}
bool isFullscreen() => false;
Stream<bool> get onFullscreenChange => const Stream.empty();
