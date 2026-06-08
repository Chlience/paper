# papers.chlience.com Server Setup

This site is built on GitHub Actions. The server only receives the final static artifact.

## Server Directory

Create a deploy directory owned by the `chlience` user:

```bash
sudo mkdir -p /var/www/papers/releases
sudo chown -R chlience:chlience /var/www/papers
```

The workflow will maintain this structure:

```text
/var/www/papers/
  releases/
    <commit-sha>/
  current -> releases/<latest-commit-sha>
```

Nginx should serve:

```text
/var/www/papers/current
```

## SSH Key

Generate a dedicated deploy key on your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-papers" -f ./papers_deploy_key
```

Add the public key to the server deploy user:

```bash
cat ./papers_deploy_key.pub
```

Append that public key to:

```text
/home/deploy/.ssh/authorized_keys
```

Store the private key in GitHub Actions secret:

```text
CHLIENCE_SSH_PRIVATE_KEY
```

## GitHub Secrets

Required:

```text
CHLIENCE_SSH_PRIVATE_KEY
```

The workflow hardcodes `chlience@chlience.com:/var/www/papers` and uses port `22`.

## Nginx

Copy `deploy/papers.chlience.com.nginx.conf` to:

```text
/etc/nginx/sites-available/papers.chlience.com
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/papers.chlience.com /etc/nginx/sites-enabled/papers.chlience.com
sudo nginx -t
sudo systemctl reload nginx
```

Then issue TLS certificate with your existing certbot flow, for example:

```bash
sudo certbot --nginx -d papers.chlience.com
```

## Deployment Behavior

On every push to `main`, GitHub Actions:

1. Installs dependencies.
2. Builds the Astro static site.
3. Runs content and link checks.
4. Packs `dist/` as a tarball.
5. Uploads the tarball to `/tmp`.
6. Extracts it into `/var/www/papers/releases/<commit-sha>`.
7. Points `/var/www/papers/current` to the new release.
8. Keeps the newest five releases.

Rollback is manual and fast:

```bash
ln -sfn /var/www/papers/releases/<previous-sha> /var/www/papers/current
```
