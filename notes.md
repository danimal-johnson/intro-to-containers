

docker exec -it docker-host bash

docker run -d -p 80:80 docker/getting-started

docker pull mongo:3
docker run -ti -v /var/run/docker.sock:/var/run/docker.sock --priveleged --rm --name docker-host docker:18.06.1-ce
docker run --interactive --tty alpine:3.10

docker ps
docker attach c3ec22ab21e8

docker run -it --name my-alpine alpine:3.10
docker logs my-alpine
docker rm my-alpine

docker run -it node:12-stretch
docker run -it node:12-stretch bash
docker pull jturpin/hollywood
docker run -it jturpin/hollywood hollywood
docker run -dit jturpin/hollywood hollywood

# Complete Intro to Containers
By Brian Holt on Front End Masters

[The dockerfile on GitHub](https://btholt.github.io/complete-intro-to-containers/)
## Introduction
## Containers
## Docker

`docker -it` is short for `docker --interactive --tty`
`docker -d` runs the docker instance in the background.
`docker run` starts a new container. `docker exec` starts a new process on an existing container.
`docker kill [process name]` will kill the container.
`docker history [container]` shows a history of how the container changed over time
`docker info` displays host info.
`docker top [container]` works like `docker exec [container] ps aux`
`docker ps --all`
`docker rm [container]`
`docker rmi [container]` removes the container *image*.
`docker container prune` removes all stopped containers. Saves very little space.
`docker image prune` removes all stopped *images*. Saves a lot of space, but deletes everything.
`docker image list` lists all images.
`docker restart [containername]` restarts the container.
`docker search python` will search for all containers on DockerHub that include python.

## The Dockerfile

### Basics
[The dockerfile on GitHub](https://btholt.github.io/complete-intro-to-containers/dockerfile)

Start the dockerfile with a container to build from
`FROM node:12-stretch`
There can only be one command in the dockerfile.
`CMD ["node", "-e", "console.log(\"omg hi lol\")"]`
With those two lines, you can then type `docker build .` from the command prompt to create the container (fast).
Now you can run it with `docker run [container]`. If you type `docker run [container] ls`, ls will run instead of our CMD line.
If we want to give it a name and version number (optional), use `docker build --tag my-node-app:1 .`.
`docker build -t` is shorthand for `docker build --tag`

### Build a Node.js app
[The project files](https://btholt.github.io/complete-intro-to-containers/build-a-nodejs-app)

* Note: Look into `process.on('SIGTERM')` for proper Node handling of shutdown requests.
* Meanwhile, `docker run --init my-node-app` will create a process called `tini` that handles SIGTERM.
* `docker run --init -rm --publish 3000:3000 my-node-app` uses the init hack, exposes port 3000, and removes the container when complete.
* In the Dockerfile, the command `COPY index.js index.js` copies index.js from the local directory into the container.
* `USER node` will change the current user to node. It will apply to everything after this line.
* Now the copy command must include the user:group "node": `COPY --chown=node:node index.js index.js`
* There is a command `ADD` that works like `COPY` but can copy across the network and unzip/untar automatically.
* `WORKDIR /home/node/code` changes directories moving forward.

### A more complicated example
[The project files](https://btholt.github.io/complete-intro-to-containers/more-complicated-nodejs-app)

We're creating a more-complicated node.js example using the hapi server package and `@hapi-pino` example.

1. Create the index.js file.
2. Run `npm init -y` and get the dependencies with `npm i @hapi/hapi hapi-pino`
3. Copy *all* the files in the Dockerfile using `COPY --chown=node:node . .`
4. At this point, if you're building from a different platform (like a Mac), the container won't run. npm must be run *in* the container first.
5. Add `RUN npm ci` to the dockerfile. The ci part will adhere to the lockfile.
6. That will cause a permissions error since /home is owned by root and we are the node user.
7. Add the line `RUN mkdir /home/node/code` before changing the workdir

The server needs to be declared as 0.0.0.0 instead of localhost or the port won't be exposed.

Instead of using the `publish 3000:3000` command line option at runtime, you can add the line `EXPOSE 3000` in the Dockerfile and run using the `-P` flag instead: `docker run --init --rm --detach -P my-node-app`. The downside is it will be published on a different port; you'll have to wait until runtime to determine which one.

### Layers
[The project files](https://btholt.github.io/complete-intro-to-containers/layers)

Layers allow the container to be built from where it left off. Each step in the Dockerfile creates a new intermediate container. Using layers saves time by not having to rebuild the whole thing from scratch--especially helpful when we start using things like npm.

* Copy the package files first: `COPY --chown=node:node package-lock.json package.json ./`
* Then `RUN npm ci`
* *Then* run `COPY --chown=node:node . .` to get the rest of the files. Now we don't have to recreate the npm files each time a file changes.

### Docker Ignore file.
This works much like a `.gitignore` file works. It leaves out files and directories you don't want copied into the image.

`.git/` and `node_modules/` are good things to add to the file.