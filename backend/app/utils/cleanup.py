import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


@contextmanager
def ephemeral_temp_dir(prefix: str = "truthscan-") -> Iterator[Path]:
    tmp = Path(tempfile.mkdtemp(prefix=prefix))
    try:
        yield tmp
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
