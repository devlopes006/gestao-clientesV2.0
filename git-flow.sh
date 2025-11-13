#!/bin/bash

# Script auxiliar para Git Flow
# Usage: ./git-flow.sh [comando] [argumentos]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
  echo -e "${BLUE}Git Flow Helper - MyGest${NC}"
  echo ""
  echo "Uso: ./git-flow.sh [comando] [argumentos]"
  echo ""
  echo "Comandos disponíveis:"
  echo ""
  echo -e "${GREEN}feature start <nome>${NC}     - Inicia nova feature"
  echo -e "${GREEN}feature finish${NC}            - Finaliza feature atual"
  echo ""
  echo -e "${GREEN}bugfix start <nome>${NC}      - Inicia novo bugfix"
  echo -e "${GREEN}bugfix finish${NC}             - Finaliza bugfix atual"
  echo ""
  echo -e "${GREEN}hotfix start <nome>${NC}      - Inicia hotfix urgente"
  echo -e "${GREEN}hotfix finish <versao>${NC}   - Finaliza hotfix (ex: 1.0.1)"
  echo ""
  echo -e "${GREEN}release start <versao>${NC}   - Inicia release (ex: 1.1.0)"
  echo -e "${GREEN}release finish${NC}            - Finaliza release"
  echo ""
  echo -e "${GREEN}sync${NC}                      - Sincroniza develop com remoto"
  echo -e "${GREEN}status${NC}                    - Mostra status das branches"
  echo -e "${GREEN}clean${NC}                     - Remove branches já mergeadas"
  echo ""
}

get_current_branch() {
  git branch --show-current
}

ensure_clean_state() {
  if [[ -n $(git status -s) ]]; then
    echo -e "${RED}✗ Existem mudanças não commitadas${NC}"
    echo ""
    git status -s
    exit 1
  fi
}

feature_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}✗ Nome da feature é obrigatório${NC}"
    echo "Uso: ./git-flow.sh feature start nome-da-feature"
    exit 1
  fi

  ensure_clean_state

  echo -e "${BLUE}Criando feature branch...${NC}"
  git checkout develop
  git pull origin develop
  git checkout -b "feature/$1"
  echo -e "${GREEN}✓ Feature branch 'feature/$1' criada${NC}"
  echo -e "${YELLOW}Desenvolva sua feature e faça commits normalmente${NC}"
}

feature_finish() {
  CURRENT=$(get_current_branch)
  
  if [[ ! $CURRENT == feature/* ]]; then
    echo -e "${RED}✗ Você não está em uma feature branch${NC}"
    exit 1
  fi

  ensure_clean_state

  echo -e "${BLUE}Finalizando feature...${NC}"
  git push origin "$CURRENT"
  echo ""
  echo -e "${GREEN}✓ Feature branch pushada para o remoto${NC}"
  echo -e "${YELLOW}Agora crie um Pull Request no GitHub:${NC}"
  echo -e "  $CURRENT → develop"
  echo ""
  echo -e "${YELLOW}Após o merge, rode: ./git-flow.sh clean${NC}"
}

bugfix_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}✗ Nome do bugfix é obrigatório${NC}"
    exit 1
  fi

  ensure_clean_state

  echo -e "${BLUE}Criando bugfix branch...${NC}"
  git checkout develop
  git pull origin develop
  git checkout -b "bugfix/$1"
  echo -e "${GREEN}✓ Bugfix branch 'bugfix/$1' criada${NC}"
}

bugfix_finish() {
  CURRENT=$(get_current_branch)
  
  if [[ ! $CURRENT == bugfix/* ]]; then
    echo -e "${RED}✗ Você não está em uma bugfix branch${NC}"
    exit 1
  fi

  ensure_clean_state

  echo -e "${BLUE}Finalizando bugfix...${NC}"
  git push origin "$CURRENT"
  echo ""
  echo -e "${GREEN}✓ Bugfix branch pushada${NC}"
  echo -e "${YELLOW}Crie um Pull Request: $CURRENT → develop${NC}"
}

hotfix_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}✗ Nome do hotfix é obrigatório${NC}"
    exit 1
  fi

  ensure_clean_state

  echo -e "${BLUE}Criando hotfix branch a partir de main...${NC}"
  git checkout main
  git pull origin main
  git checkout -b "hotfix/$1"
  echo -e "${GREEN}✓ Hotfix branch 'hotfix/$1' criada${NC}"
  echo -e "${RED}⚠ ATENÇÃO: Este é um hotfix de produção!${NC}"
}

hotfix_finish() {
  if [ -z "$1" ]; then
    echo -e "${RED}✗ Versão é obrigatória (ex: 1.0.1)${NC}"
    exit 1
  fi

  CURRENT=$(get_current_branch)
  
  if [[ ! $CURRENT == hotfix/* ]]; then
    echo -e "${RED}✗ Você não está em uma hotfix branch${NC}"
    exit 1
  fi

  ensure_clean_state

  VERSION="v$1"

  echo -e "${BLUE}Finalizando hotfix...${NC}"
  
  # Merge em main
  echo -e "${YELLOW}Mergeando em main...${NC}"
  git checkout main
  git pull origin main
  git merge "$CURRENT" --no-ff -m "Merge $CURRENT"
  git tag -a "$VERSION" -m "Hotfix $VERSION"
  git push origin main --tags
  
  # Merge em develop
  echo -e "${YELLOW}Mergeando em develop...${NC}"
  git checkout develop
  git pull origin develop
  git merge "$CURRENT" --no-ff -m "Merge $CURRENT"
  git push origin develop
  
  # Deletar branch
  git branch -d "$CURRENT"
  git push origin --delete "$CURRENT" 2>/dev/null || true
  
  echo -e "${GREEN}✓ Hotfix finalizado e deployado em produção!${NC}"
  echo -e "${GREEN}✓ Tag $VERSION criada${NC}"
}

release_start() {
  if [ -z "$1" ]; then
    echo -e "${RED}✗ Versão é obrigatória (ex: 1.1.0)${NC}"
    exit 1
  fi

  ensure_clean_state

  echo -e "${BLUE}Criando release branch...${NC}"
  git checkout develop
  git pull origin develop
  git checkout -b "release/v$1"
  echo -e "${GREEN}✓ Release branch 'release/v$1' criada${NC}"
  echo -e "${YELLOW}Faça ajustes finais (versão, changelog) e commite${NC}"
}

release_finish() {
  CURRENT=$(get_current_branch)
  
  if [[ ! $CURRENT == release/* ]]; then
    echo -e "${RED}✗ Você não está em uma release branch${NC}"
    exit 1
  fi

  ensure_clean_state

  VERSION=$(echo "$CURRENT" | sed 's/release\///')

  echo -e "${BLUE}Finalizando release...${NC}"
  
  # Merge em main
  echo -e "${YELLOW}Mergeando em main...${NC}"
  git checkout main
  git pull origin main
  git merge "$CURRENT" --no-ff -m "Release $VERSION"
  git tag -a "$VERSION" -m "Release $VERSION"
  git push origin main --tags
  
  # Merge em develop
  echo -e "${YELLOW}Mergeando em develop...${NC}"
  git checkout develop
  git pull origin develop
  git merge "$CURRENT" --no-ff -m "Merge $CURRENT"
  git push origin develop
  
  # Deletar branch
  git branch -d "$CURRENT"
  
  echo -e "${GREEN}✓ Release $VERSION finalizada!${NC}"
  git checkout develop
}

sync_develop() {
  echo -e "${BLUE}Sincronizando develop...${NC}"
  CURRENT=$(get_current_branch)
  git checkout develop
  git pull origin develop
  if [ "$CURRENT" != "develop" ]; then
    git checkout "$CURRENT"
    echo -e "${GREEN}✓ Develop sincronizado. Voltando para $CURRENT${NC}"
  else
    echo -e "${GREEN}✓ Develop sincronizado${NC}"
  fi
}

show_status() {
  echo -e "${BLUE}Status das branches:${NC}"
  echo ""
  echo -e "${YELLOW}Branch atual:${NC}"
  git branch --show-current
  echo ""
  echo -e "${YELLOW}Branches locais:${NC}"
  git branch
  echo ""
  echo -e "${YELLOW}Últimos commits:${NC}"
  git log --oneline -5
}

clean_branches() {
  echo -e "${BLUE}Limpando branches já mergeadas...${NC}"
  git checkout develop
  git pull origin develop
  git fetch --prune
  
  MERGED=$(git branch --merged develop | grep -v "^\*\|main\|develop" || true)
  
  if [ -z "$MERGED" ]; then
    echo -e "${GREEN}✓ Nenhuma branch para limpar${NC}"
  else
    echo -e "${YELLOW}Branches mergeadas:${NC}"
    echo "$MERGED"
    echo ""
    read -p "Deletar essas branches? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "$MERGED" | xargs git branch -d
      echo -e "${GREEN}✓ Branches deletadas${NC}"
    fi
  fi
}

# Main
case "$1" in
  feature)
    case "$2" in
      start) feature_start "$3" ;;
      finish) feature_finish ;;
      *) show_help ;;
    esac
    ;;
  bugfix)
    case "$2" in
      start) bugfix_start "$3" ;;
      finish) bugfix_finish ;;
      *) show_help ;;
    esac
    ;;
  hotfix)
    case "$2" in
      start) hotfix_start "$3" ;;
      finish) hotfix_finish "$3" ;;
      *) show_help ;;
    esac
    ;;
  release)
    case "$2" in
      start) release_start "$3" ;;
      finish) release_finish ;;
      *) show_help ;;
    esac
    ;;
  sync) sync_develop ;;
  status) show_status ;;
  clean) clean_branches ;;
  *) show_help ;;
esac
