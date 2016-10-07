NODE = node
NODE_OPTS = --use-strict
TEST_OPTS =

love:
	@echo "Feel like makin' love."

test:
	@$(NODE) $(NODE_OPTS) ./node_modules/.bin/_mocha -R dot $(TEST_OPTS)

spec:
	@$(NODE) $(NODE_OPTS) ./node_modules/.bin/_mocha -R spec $(TEST_OPTS)

autotest:
	@$(NODE) $(NODE_OPTS) ./node_modules/.bin/_mocha -R dot --watch $(TEST_OPTS)

autospec:
	@$(NODE) $(NODE_OPTS) ./node_modules/.bin/_mocha -R spec --watch $(TEST_OPTS)

pack:
	@file=$$(npm pack); echo "$$file"; tar tf "$$file"

publish:
	npm publish

clean:
	rm *.tgz

tag:
	git tag "v$$($(NODE) -e 'console.log(require("./package").version)')"

.PHONY: love
.PHONY: test spec autotest autospec
.PHONY: pack publish clean
.PHONY: tag
