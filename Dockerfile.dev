# Use the official Ubuntu base image
FROM ubuntu:23.10

# Set the default working directory
WORKDIR /opt/data

# Update Path
ENV PATH=/opt/data/go/bin:/opt/data/nvim-linux64/bin:$PATH

# Install fonts for lazyvim
ADD https://github.com/ryanoasis/nerd-fonts/raw/master/patched-fonts/AnonymousPro/Regular/AnonymiceProNerdFontMono-Regular.ttf /usr/local/share/fonts/
ADD https://github.com/ryanoasis/nerd-fonts/raw/master/patched-fonts/NerdFontsSymbolsOnly/SymbolsNerdFontMono-Regular.ttf /usr/local/share/fonts/

# Update packages and install necessary tools
RUN apt-get update -y && \
    apt-get install -y curl git build-essential ripgrep fd-find

# Install Neo-vim
ADD https://github.com/neovim/neovim/releases/download/stable/nvim-linux64.tar.gz /opt/nvim/
RUN tar xzvf /opt/nvim/nvim-linux64.tar.gz

# Install lazyvim
RUN git clone https://github.com/LazyVim/starter ~/.config/nvim && \
    rm -rf ~/.config/nvim/.git

# Install lazygit for lazyvim
RUN LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*') && \
    curl -Lo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz" && \
    tar xf lazygit.tar.gz lazygit && \
    install lazygit /usr/local/bin

# Install Go
RUN curl -LO https://golang.org/dl/go1.22.1.linux-amd64.tar.gz && \
    tar -C /opt/data -xzf go1.22.1.linux-amd64.tar.gz && \
    rm go1.22.1.linux-amd64.tar.gz

# Default to a shell, can always pass a command like nvim to the shell on launch
ENTRYPOINT ["/bin/bash"]
