DIST_DIR := $(shell pwd)/dist

help:
	@echo "install - Install in dev location"
	@echo "uninstall - Uninstall from dev location"
	@echo "docs - Generate Sphinx documentation"

clean: clean-build clean-gulp clean-pydist

clean-build:
	rm -rf build/
	rm -rf dist/

clean-gulp:
	gulp clean 2>/dev/null || true

docs:
	open docs/premiere-otio/index.html

deps:
	npm install
	jspm install

build-dev:
	gulp build-dev

build:
	gulp build-prod

install:
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" 2>/dev/null || true
	cmd /c mklink /J "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" "$(shell cygpath -w $(DIST_DIR))"
	gulp build-dev

uninstall:
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" 2>/dev/null || true
