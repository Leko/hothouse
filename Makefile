
NPMBIN := ./node_modules/.bin

.PHONY: publish

publish: exists-jq exists-hub .release_note
	npm run bootstrap
	$(eval PREVIOUS_VERSION:=$(shell jq -r .version lerna.json))
	$(eval PREVIOUS_TAG:=v$(PREVIOUS_VERSION))

	$(NPMBIN)/lerna publish --force-publish=*

	$(eval LATEST_VERSION:=$(shell jq -r .version lerna.json))
	$(eval LATEST_TAG:=v$(LATEST_VERSION))

	$(NPMBIN)/dotenv $(NPMBIN)/lerna-changelog -- --from=$(PREVIOUS_TAG) \
		| sed 's/^## //' > .release_note/$(LATEST_TAG).md

	cat .release_note/$(LATEST_TAG).md
	hub release create -F .release_note/$(LATEST_TAG).md $(LATEST_TAG)

exists-jq:
	@which jq > /dev/null

exists-hub:
	@which hub > /dev/null

.release_note:
	mkdir .release_note
