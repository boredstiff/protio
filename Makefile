DIST_DIR := $(shell pwd)/dist

help:
	@echo "build - Create built extension for the current platform"
	@echo "install - Install the built extension"
	@echo "dev - Install in dev location"
	@echo "docs - Generate documentation"

clean: clean-build clean-gulp

clean-build:
	rm -rf build/
	rm -rf dist/

clean-gulp:
	gulp clean 2>/dev/null || true

_docs:
	gulp docs

docs: _docs
	open docs/protio/index.html

release-docs: _docs

deps:~
	npm install
	jspm install

build-dev:
	gulp build-dev

build:
	gulp build-prod

ifeq ($(uname_S), Windows)
dev: clean	
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" 2>/dev/null || true
	cmd /c mklink /J "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" "$(shell cygpath -w $(DIST_DIR))"
	gulp build-dev
else
dev: clean
	rm "/Library/Application Support/Adobe/CEP/extensions/protio" 2>/dev/null || true
	ln -s $(shell pwd)/dist "/Library/Application Support/Adobe/CEP/extensions/protio"
	gulp watch
endif

uninstall:
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" 2>/dev/null || true
