

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

## Making Tiny Containers
Node alpine is a tiny, minimalist distribution of Linux with node installed. It's about 80MB instead of 1GB. To switch our example from a full debian installation, just change the first line from `FROM node:12-stretch` to `FROM node:12-alpine`. Easy peasy.

Building directly from Alpine (5MB):
`docker inspect alpine:3.10` gives more information about the image. Pipe it through `jq` to colorize the output.

### To build our image directly from Alpine (about 50MB):
* Replace `FROM node:12-alpine` with `FROM alpine:3.10`.
* Node must be installed manually. Add `RUN apk add --update nodejs npm` (apk is the package manager).
* The `node` user and group must be added with `RUN addgroup -S node && adduser -S node -G node`

### Multi-stage builds are a thing.
* [The repository](https://btholt.github.io/complete-intro-to-containers/multi-stage-builds)
* This allows you to include things in development, but remove for production.
* Each stage seems to start with the next `FROM` command.
* To copy from the previous build, use the from flag. Ex: `COPY --from=0 --chown=node:node /build .` where 0 is the first stage.
* If you label your stages with `FROM node:12-stretch AS build`), you can copy with `--from=build`
* Multiple Docker files are possible, but rare. You can build from an alternative file using `docker build -t -f alt.Dockerfile .`

### Static Assets project
This section builds a React TypeScript app, hosted by Nginx in a Docker Alpine container.
[The instructions](https://btholt.github.io/complete-intro-to-containers/static-assets-project)

* start with `npx --ignore-existing create-react-app static-assets-project --template typescript --use-npm`. I created the directory first and used this: `create-react-app . --template typescript --use-npm` Apparently, the default is yarn if you don't specify npm.
* Add `npm i node-sass`. Rename the `.css` files to `.scss`. Edit `App.tsx` and `index.tsx` accordingly.
* Run `npm run start` to make sure it works. Then run `npm run build` to make the optimized version.
* Create a .dockerignore file! (I forgot this and had to wait a half hour for an extra 1.5GB to be wasted.)
* Create the Dockerfile. Start `FROM node:latest`. Set `WORKDIR /app`. `COPY . .` (remember that this checks the `.dockerignore` file). Finally, `RUN npm ci && npm run build` to recreate the optimized build under `/app`.
* Let's add the next "layer" in the tiny Nginx Alpine container: `FROM nginx:alpine`, `COPY --from=0 /app/build /usr/share/nginx/html`
* Nginx defines CMD automatically, so it doesn't need to be overridden. It runs on port 80, by default, so change it at the command prompt if necessary.

Run it:
* `docker build -t static-app .`
* `docker run -p 8080:80 static-app` to run it on port 8080 in the foreground.
* `docker run -d -p 8080:80 static-app` to run it detached in the background.

## Docker Features
### Bind Mounts
[Project](https://btholt.github.io/complete-intro-to-containers/bind-mounts)

* Avoiding snowflakes and cattle.
* Need to keep core data in a database.
* Bind mounts are like portals to a computer.
* Volume mounts = internally managed.

Bind mount example:
`docker run --mount type=bind,source="$(pwd)"/build,target=/usr/share/nginx/html -p 8080:80 nginx:1.17`
* No additional Dockerfile involved.
* Running nginx, serving the external directory `./build` from inside the container.

Volume mount example:
[Project](https://btholt.github.io/complete-intro-to-containers/volumes)
* Creating a persistent volume inside of the Docker image.
* Running an index.js file in Node to update a file each time the container is run.
* `docker build --tag=incrementor .`
* `docker run incrementor` won't use the volume. A new, temporary file will always be created.
* `docker run --env DATA_PATH=/data/num.txt --mount type=volume,src=incrementor-data,target=/data incrementor`

If you have data that's really meant for the container and not for the OS, always prefer volume mounts over bind mounts.
Bind mounts are really meant for those times when you want interaction between the container and the host. (e.g. logs and databases)
Multiple containers can share the same mounts.

Windows containers are actually full, virtualized Windows images.


### Using Containers for your Dev Environment

[The project](https://btholt.github.io/complete-intro-to-containers/dev-containers)

* Hugo is a static site generator for the Go language.
* We don't have to know Go to get up and running with it.
* We can use a container called hugo-builder
* `git clone https://github.com/btholt/hugo-example.git`
* `docker run --rm -it --mount type=bind,source="$(pwd)",target=/src -p 1313:1313 -u hugo jguyomard/hugo-builder:0.55 hugo server -w --bind=0.0.0.0`
* That line runs the hugo server on localhost, exposed on port 1313. It binds the hosted /src directory to the current dir (pwd). The Docker image is `jguyomard/hugo-builder:0.55`. No Dockerile is used.

### Dev Containers in VS Code
[Project files](https://btholt.github.io/complete-intro-to-containers/visual-studio-code)

Note: Under Windows with WSL, you need to reopen folder in Windows first, and then reopen again in container. (Otherwise it won't work.)

* Create a directory called .devcontainer
* A Dockerfile can be added to list dependencies:
* - `FROM node:12-stretch`
* - `RUN npm install --global eslint prettier`
* A `devcontainer.json` file contains all the details
* - Name, Dockerfile location, app port, run arguments, etc.

Evil prank (a horrible Windows 3.1 theme): 
* Under `settings`, add `"wlrkbench.colorTheme": "Hot Dog Stand",`
* Under `extensions` add `"somekittens.hot-dog-stand,"

### Networking in Docker: MongoDB container
[Project files](https://btholt.github.io/complete-intro-to-containers/networking)

* Use `docker network ls` for status. `bridge` is the default.
* `docker network create --driver=bridge app-net` (App-net is just our name for the new network.)
* `docker run -d --network=app-net -p 27017:27017 --name=db --rm mongo:3`
* (Run a detached instance of a MongoDB container using the app-net network on the default port 27017)

Now we'll use one container to talk to the other container:
* `docker run -it --network=app-net --rm mongo:3 mongo --host db`
* (Interactive, TTY, image=mongo v.3, run "mongo". The Docker host "db" was defined above.)
* Mongo command: `show dbs` lists databases.
* `docker ps` will list both running containers. `docker top db` will show the top processes in the `db` container.

That was just an example. Now let's create a node.js container to access our MongoDB database.