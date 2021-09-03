# linz/depcheck-action

Check that all used dependencies are listed inside the `package.json` of the project

## Usage

Add the following snippet to a github action
```yaml
    - uses: linz/depcheck-action@v1
      with:
        # Defaults to './package.json'
        package-json: tests/single-missing/package.json
        # Ignore packages
        package-ignore: "aws-cdk, @aws-cdk/core"
```