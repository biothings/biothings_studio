[![Build & Deploy Status](https://github.com/biothings/biothings_studio/actions/workflows/main.yml/badge.svg)](https://github.com/biothings/biothings_studio/actions/workflows/main.yml)
![Docker Pulls](https://img.shields.io/docker/pulls/biothings/biothings-studio)

**BioThings Studio** is a pre-configured, ready-to-use software. At its core is **BioThings Hub**, the backend system behind all BioThings API.


## Step-by-step tutorial
http://docs.biothings.io/en/latest/doc/studio.html

## Stable releases
See latest release note https://github.com/biothings/biothings_studio/releases/tag/0.2b for all available commands to fetch Docker images

## Unstable releases

For the brave ones, unstable release running latest Studio and latest BioThings SDK (master branches) can now be found on Docker Hub and be pulled using `docker pull` command:

```
docker pull biothings/biothings-studio:unstable
```

Note each time the docker image is started, code is automatically updated to the latest commit.

Finally, BioThings Studio comes in different flavors, to facilitate contributions to our existing BioThings API:

- *Studio for MyGene.info*: `docker pull biothings/studio4mygene:unstable`
- *Studio for MyVariant.info* : `docker pull biothings/studio4myvariant:unstable`
- *Studio for MyChem.info* : `docker pull biothings/studio4mychem:unstable`


## Logging in to a hub

A hub can require a login to run commands or change data: define its users in `HUB_API_USERS`
(in `config_studio_hub.py` for Studio's own hub), with password hashes made with
`python -m biothings.utils.passwords`. Studio then asks for a username and password when a command
needs them, or when clicking the user icon next to the hub's name, and keeps one login per hub.

## Build Images

Please see the README.md file in the 'docker' directory.

## Releasing

The webapp is hosted at https://studio.biothings.io. `/master/` runs the latest `master`, deployed on
every push. Each release has its own folder, e.g. `/0.4a/`, deployed when its GitHub release is
published, and `/` runs a copy of the current release's folder.

To release, check https://studio.biothings.io/master/ against the hubs you care about, then publish a
release from `master`. Use the next letter for fixes (`0.5b`) and the next minor version for new
features (`0.6a`). A pre-release (`--prerelease`) is only deployed to its folder, leaving `/` alone.

```
gh release create 0.5a --target master --generate-notes
```

To roll back, or to make a pre-release live, run the *Release BioThings Studio Webapp* workflow from
the Actions tab with the release's tag, which copies its folder to `/`:

```
gh workflow run release.yml -f tag=0.4a
```

`webapp/compat.root.json` becomes `/compat.json` whenever a release goes live. Studio reads it from the
site root, whichever folder it runs from, to send hubs on older BioThings versions to a release that
works with them. If a release needs a newer hub than some users run, add an entry there sending older
hubs to the previous release. Edit this file, not the bucket's copy: the next release overwrites it.

## More information

**Biothings Studio** is part of the *Biothings API* ecosystem, more information can be found here: https://github.com/biothings/biothings.api
