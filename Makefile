DIST_DIR := $(shell pwd)/dist

help:
	@echo "build - Create built extension for the current platform"
	@echo "install - Install the built extension"
	@echo "dev - Install in dev location"
	@echo "docs - Generate documentation"
	@echo "debug - Set the reg/plist keys for debugging a CEP extension"

uname_S := None
ifeq ($(OS),Windows_NT)
	uname_S := Windows
else:
	uname_S := $(shell sh -c 'uname -s 2>/dev/null || echo not')
endif

DIST_DIR := $(shell pwd)/dist

clean: clean-build clean-gulp

clean-build:
	rm -rf build/
	rm -rf dist/

clean-gulp:
	gulp clean 2>/dev/null || true

ifneq ($(uname_S), Windows)
debug:
	defaults write com.adobe.CSXS.8 PlayerDebugMode 1
endif

_docs:
	gulp docs

docs: _docs
	open docs/protio/index.html

release-docs: _docs

deps:~
	yarn install
	jspm install

build-dev:
	gulp watch


build:
ifneq ($(uname_S), Windows)
	gulp build-prod
	./bin/ZXPSignCmd -sign dist output/protio.zxp MyCert.p12 abc123
else
	gulp build-prod
endif

deploy:
ifneq ($(uname_S), Windows)
	rm "/Library/Application Support/Adobe/CEP/extensions/protio" 2>/dev/null || true
	mkdir -p "/Library/Application Support/Adobe/CEP/extensions/protio" 2>/dev/null || true
	cp output/protio.zxp "/Library/Application Support/Adobe/CEP/extensions/protio/protio.zxp"
else
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\protio" 2>/dev/null || true
	xcopy /EHK output/protio.zxp "%APPDATA%\\Adobe\\CEP\\extensions\\protio\\protio.zxp"
endif


ifeq ($(uname_S), Windows)
dev: clean
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\protio" 2>/dev/null || true
	cmd /c mklink /J "%APPDATA%\\Adobe\\CEP\\extensions\\protio" "$(shell cygpath -w $(DIST_DIR))"
	gulp watch
else
dev: clean
	rm "/Library/Application Support/Adobe/CEP/extensions/protio" 2>/dev/null || true
	ln -s $(DIST_DIR) "/Library/Application Support/Adobe/CEP/extensions/protio"
	gulp watch
endif

uninstall:
	cmd /c rmdir /Q "%APPDATA%\\Adobe\\CEP\\extensions\\premiere-otio" 2>/dev/null || true

ifneq ($(uname_S), Windows)
create-cert:
	./bin/ZXPSignCmd -selfSignedCert US OR MyCompanyName MyPersonName abc123 MyCert.p12
endif
