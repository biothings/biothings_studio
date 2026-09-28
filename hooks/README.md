# Hub hooks

Python files (`*.py`) in this folder are loaded by the Hub when it starts (`HOOKS_FOLDER`
setting, `./hooks` by default). Functions they define become Hub commands, which can be run
from the Studio terminal, with `biothings-cli hub run ...`, or from the Hub console (SSH).

- A hook can use any Hub command: `sources()`, `dump(...)`, `lsmerge(...)`, `schedule(...)`...
- A function's docstring documents the command (`help`, `help <command>`).
- `async def` functions run in background, and are followed like other Hub jobs.
- Names starting with `_` are private helpers, and imported names aren't commands.
  Define `__all__` to list exactly which names are commands.
- The `hooks` command lists the hook files loaded, and why a hook failed to load.

Example, `hooks/my_commands.py`:

```python
import asyncio


def source_names():
    """Names of the sources registered in the Hub"""
    return sorted(src["name"] for src in sources())


async def dump_sources(*names, force=False):
    """Download the given sources, one after the other (runs in background)"""
    for name in names:
        await asyncio.gather(*dump(name, force=force))
    return "downloaded %s" % ", ".join(names)
```

After restarting the Hub, in the Studio terminal:

```
hub> source_names
hub> dump_sources mygene mychem --force
```

or from a shell:

```
biothings-cli hub run dump_sources mygene mychem --force
```

More in the [BioThings Studio guide](https://docs.biothings.io/en/latest/tutorial/studio_guide.html#hooks-and-custom-commands).
