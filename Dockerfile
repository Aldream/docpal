FROM    ubuntu:latest

# --- Installing Node.js

RUN apt-get install -y python-software-properties python python-setuptools ruby rubygems
RUN add-apt-repository ppa:chris-lea/node.js

# Fixing broken dependencies ("nodejs : Depends: rlwrap but it is not installable"):
RUN echo "deb http://archive.ubuntu.com/ubuntu precise universe" >> /etc/apt/sources.list

RUN echo "deb http://us.archive.ubuntu.com/ubuntu/ precise universe" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y nodejs 

# Removed unnecessary packages
RUN apt-get purge -y python-software-properties python python-setuptools ruby rubygems
RUN apt-get autoremove -y

# Clear package repository cache
RUN apt-get clean all

# --- Bundle app source
ADD . /src
# Install app dependencies
RUN cd /src; npm install

EXPOSE  8080
CMD ["node", "/src/start.js"]
