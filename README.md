[![Build Status](https://travis-ci.org/biothings/biothings_studio.svg?branch=master)](https://travis-ci.org/biothings/biothings_studio) ![Docker Pulls](https://img.shields.io/docker/pulls/biothings/biothings-studio)

**BioThings Studio** is a pre-configured, ready-to-use software. At its core is **BioThings Hub**, the backend system behind all BioThings API.


## Step-by-step tutorial
http://docs.biothings.io/en/latest/doc/studio.html

## Stable releases
See latest release note https://github.com/biothings/biothings_studio/releases/tag/0.2a for all available commands to fetch Docker images

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


## Build Images

Please see the README.md file in the 'docker' directory.

## More information

**Biothings Studio** is part of the *Biothings API* ecosystem, more information can be found here: https://github.com/biothings/biothings.api
