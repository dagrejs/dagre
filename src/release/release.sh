# Fail on error
set -e
[ -n "$DEBUG"] && set -x

bail() {
    echo $1 >&2
    exit 1
}

# Initial config
PROJECT=$1
PROJECT_ROOT=`pwd`
BOWER_DIR=/tmp/$PROJECT-bower
PAGES_DIR=/tmp/$PROJECT-pages
DIST_DIR=$2

# Check version. Is this a release? If not abort
VERSION=$(./src/release/check-version.js)
SHORT_VERSION=$(echo $VERSION | cut -f1 -d-)

echo Attemping to publish version: $VERSION

# Preflight checks
[ -n "$PROJECT" ] || bail "No project name was specified."
[ -n "$DIST_DIR" ] || bail "No dist dir was specified."
[ -z "`git tag -l v$VERSION`" ] || bail "Version already published. Skipping publish."
[ -n "`grep v$SHORT_VERSION CHANGELOG.md`" ] || bail "ERROR: No entry for v$VERSION in CHANGELOG.md"
[ "`git rev-parse HEAD`" = "`git rev-parse master`" ] || [ -n "$PRE_RELEASE" ] || bail "ERROR: You must release from the master branch"
[ -z "`git status --porcelain`" ] || bail "ERROR: Dirty index on working tree. Use git status to check"

# Publish to pages
rm -rf $PAGES_DIR
git clone git@github.com:cpettitt/cpettitt.github.com.git $PAGES_DIR

TMP_TARGET=$PAGES_DIR/project/$PROJECT/latest
rm -rf $TMP_TARGET
mkdir -p $TMP_TARGET
cp -r $DIST_DIR/*.js $TMP_TARGET

TMP_TARGET=$PAGES_DIR/project/$PROJECT/v$VERSION
rm -rf $TMP_TARGET
mkdir -p $TMP_TARGET
cp -r $DIST_DIR/*.js $TMP_TARGET

cd $PAGES_DIR/project/$PROJECT
git add -A
git commit -m "Publishing $PROJECT v$VERSION"
git push -f origin master
cd $PROJECT_ROOT
echo "Published $PROJECT to pages"

# Publish bower
rm -rf $BOWER_DIR
git clone git@github.com:cpettitt/$PROJECT-bower.git $BOWER_DIR
rm -f $BOWER_DIR/bower.json
rm -rf $BOWER_DIR/js

mkdir $BOWER_DIR/js

cp $DIST_DIR/bower.json $BOWER_DIR
cp $DIST_DIR/$PROJECT*.js $BOWER_DIR/js
cp $DIST_DIR/LICENSE $BOWER_DIR

cd $BOWER_DIR
git add -A
git commit -m "Publishing bower for $PROJECT v$VERSION"
git push -f origin master
git tag v$VERSION
git push origin v$VERSION
cd $PROJECT_ROOT
echo "Published $PROJECT to bower"

# Publish tag
git tag v$VERSION
git push origin
git push origin v$VERSION
echo Published $PROJECT v$VERSION

# Publish to npm
npm publish
echo Published to npm

# Update patch level version + commit
./src/release/bump-version.js
make lib/version.js
git commit package.json lib/version.js -m "Bump version and set as pre-release"
git push origin
echo Updated patch version

echo Release complete!
